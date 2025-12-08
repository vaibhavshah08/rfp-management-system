import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Grid,
  Divider,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import {
  Send as SendIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  SaveOutlined as SaveOutlinedIcon,
} from "@mui/icons-material";
import { rfpApi, vendorApi } from "../services/api";
import type { Rfp, Vendor } from "../types";
import { useToast } from "../contexts/ToastContext";

type CreateRfpPayload = {
  description: string;
};

type SendRfpPayload = {
  rfp_id: string;
  vendor_ids: string[];
};

type EmailPreview = {
  html: string;
  text: string;
  subject: string;
};

export default function CreateRfpPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const draftId = searchParams.get("draft");

  const [description, setDescription] = useState("");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [currentRfp, setCurrentRfp] = useState<Rfp | null>(null);
  const [currentDraft, setCurrentDraft] = useState<Rfp | null>(null);
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const {
    data: vendors = [],
    isLoading: vendorsLoading,
    isError: vendorsError,
  } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: async () => {
      try {
        const response = await vendorApi.getAll();
        return response?.data || [];
      } catch (error: any) {
        console.error("Error loading vendors:", error);
        throw new Error(
          error?.response?.data?.message || "Failed to load vendors"
        );
      }
    },
  });

  const {
    data: draftData,
    isLoading: draftLoading,
    isError: draftError,
  } = useQuery<Rfp | null>({
    queryKey: ["draft", draftId],
    queryFn: async () => {
      if (!draftId) return null;
      try {
        const response = await rfpApi.getById(draftId);
        return response?.data || null;
      } catch (error: any) {
        console.error("Error loading draft:", error);
        throw new Error(
          error?.response?.data?.message || "Failed to load draft"
        );
      }
    },
    enabled: !!draftId,
  });

  useEffect(() => {
    if (draftError) {
      showToast("Failed to load draft", "error");
      return;
    }
    if (draftLoading) {
      return;
    }
    if (draftData && draftData.is_draft) {
      setCurrentDraft(draftData);
      setDescription(draftData?.description_raw || "");
      setHasUnsavedChanges(false);

      const hasStructuredData =
        draftData.structured_data &&
        ((draftData.structured_data.budget !== null &&
          draftData.structured_data.budget !== undefined) ||
          (draftData.structured_data.items &&
            draftData.structured_data.items.length > 0 &&
            draftData.structured_data.items.some((item: any) =>
              item?.name?.trim()
            )) ||
          (draftData.structured_data.delivery_timeline &&
            draftData.structured_data.delivery_timeline.trim()) ||
          (draftData.structured_data.payment_terms &&
            draftData.structured_data.payment_terms.trim()) ||
          (draftData.structured_data.warranty &&
            draftData.structured_data.warranty.trim()));

      if (hasStructuredData) {
        setCurrentRfp(draftData);
        setEditDescription(draftData.description_raw);

        if (draftData.structured_data?.metadata?.selected_vendors) {
          setSelectedVendors(
            draftData.structured_data.metadata.selected_vendors
          );
        }

        rfpApi
          .getEmailPreview(draftData.id)
          .then((response) => {
            setEmailPreview(response.data);
          })
          .catch((error) => {
            console.error("Failed to fetch email preview", error);
          });
      }
    }
  }, [draftData]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !currentRfp && !currentDraft) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, currentRfp, currentDraft]);

  useEffect(() => {
    if (description && !currentRfp && !currentDraft) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [description, currentRfp, currentDraft]);

  const {
    mutate: createRfp,
    isPending: isCreatingRfp,
    isError: createRfpError,
  } = useMutation<Rfp, unknown, CreateRfpPayload>({
    mutationFn: async (payload) => {
      const response = await rfpApi.create(payload);
      return response.data;
    },
    onSuccess: async (rfp) => {
      const hasValidData =
        (rfp.structured_data.budget !== null &&
          rfp.structured_data.budget !== undefined) ||
        (rfp.structured_data.items &&
          rfp.structured_data.items.length > 0 &&
          rfp.structured_data.items.some((item: any) => item?.name?.trim())) ||
        (rfp.structured_data.delivery_timeline &&
          rfp.structured_data.delivery_timeline.trim()) ||
        (rfp.structured_data.payment_terms &&
          rfp.structured_data.payment_terms.trim()) ||
        (rfp.structured_data.warranty && rfp.structured_data.warranty.trim());

      if (!hasValidData) {
        setValidationError(
          "The description provided is not detailed enough. Please provide more specific information including: items/products needed, quantities, budget, delivery timeline, payment terms, or warranty requirements."
        );
        setEmailPreview(null);
        return;
      }

      setCurrentRfp(rfp);
      if (rfp.is_draft) {
        setCurrentDraft(rfp);
      }
      setEditDescription(rfp.description_raw);
      setIsEditing(false);
      setValidationError(null);
      try {
        const previewResponse = await rfpApi.getEmailPreview(rfp.id);
        setEmailPreview(previewResponse.data);
      } catch (error) {
        console.error("Failed to fetch email preview", error);
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        "The description provided is not detailed enough. Please provide more specific information including: items/products needed, quantities, budget, delivery timeline, payment terms, or warranty requirements.";
      setValidationError(errorMessage);
      setEmailPreview(null);
    },
  });

  const { mutate: regenerateRfp, isPending: isRegenerating } = useMutation<
    Rfp,
    unknown,
    string
  >({
    mutationFn: async (rfp_id) => {
      const response = await rfpApi.regenerate(rfp_id);
      return response.data;
    },
    onSuccess: async (rfp) => {
      const hasValidData =
        (rfp.structured_data.budget !== null &&
          rfp.structured_data.budget !== undefined) ||
        (rfp.structured_data.items &&
          rfp.structured_data.items.length > 0 &&
          rfp.structured_data.items.some((item: any) => item?.name?.trim())) ||
        (rfp.structured_data.delivery_timeline &&
          rfp.structured_data.delivery_timeline.trim()) ||
        (rfp.structured_data.payment_terms &&
          rfp.structured_data.payment_terms.trim()) ||
        (rfp.structured_data.warranty && rfp.structured_data.warranty.trim());

      if (!hasValidData) {
        setValidationError(
          "The description provided is not detailed enough. Please edit the description to include more specific information: items/products needed, quantities, budget, delivery timeline, payment terms, or warranty requirements."
        );
        setEmailPreview(null);
        return;
      }

      setCurrentRfp(rfp);
      setValidationError(null);
      try {
        const previewResponse = await rfpApi.getEmailPreview(rfp.id);
        setEmailPreview(previewResponse.data);
      } catch (error) {
        console.error("Failed to fetch email preview", error);
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        "The description provided is not detailed enough. Please edit the description to include more specific information.";
      setValidationError(errorMessage);
      setEmailPreview(null);
    },
  });

  const { mutate: updateRfp, isPending: isUpdatingRfp } = useMutation<
    Rfp,
    unknown,
    { id: string; description: string }
  >({
    mutationFn: async ({ id, description }) => {
      const response = await rfpApi.update(id, { description });
      return response.data;
    },
    onSuccess: async (rfp) => {
      const hasValidData =
        (rfp.structured_data.budget !== null &&
          rfp.structured_data.budget !== undefined) ||
        (rfp.structured_data.items &&
          rfp.structured_data.items.length > 0 &&
          rfp.structured_data.items.some((item: any) => item?.name?.trim())) ||
        (rfp.structured_data.delivery_timeline &&
          rfp.structured_data.delivery_timeline.trim()) ||
        (rfp.structured_data.payment_terms &&
          rfp.structured_data.payment_terms.trim()) ||
        (rfp.structured_data.warranty && rfp.structured_data.warranty.trim());

      if (!hasValidData) {
        setValidationError(
          "The description provided is not detailed enough. Please provide more specific information including: items/products needed, quantities, budget, delivery timeline, payment terms, or warranty requirements."
        );
        setEmailPreview(null);
        setIsEditing(true); // Keep in edit mode so user can fix it
        return;
      }

      setCurrentRfp(rfp);
      if (rfp.is_draft) {
        setCurrentDraft(rfp);
      }
      setIsEditing(false);
      setDescription(rfp.description_raw);
      setValidationError(null);
      try {
        const previewResponse = await rfpApi.getEmailPreview(rfp.id);
        setEmailPreview(previewResponse.data);
      } catch (error) {
        console.error("Failed to fetch email preview", error);
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        "The description provided is not detailed enough. Please provide more specific information.";
      setValidationError(errorMessage);
    },
  });

  const { mutate: createDraft, isPending: isSavingDraft } = useMutation<
    Rfp,
    unknown,
    { description: string; selected_vendors?: string[] }
  >({
    mutationFn: async (payload) => {
      if (currentDraft) {
        const response = await rfpApi.updateDraft(currentDraft.id, {
          description: payload.description,
          selected_vendors: payload.selected_vendors,
        });
        return response.data;
      } else {
        const response = await rfpApi.createDraft({
          description: payload.description,
        });
        const draft = response.data;
        if (payload.selected_vendors && payload.selected_vendors.length > 0) {
          const updatedResponse = await rfpApi.updateDraft(draft.id, {
            description: payload.description,
            selected_vendors: payload.selected_vendors,
          });
          return updatedResponse.data;
        }
        return draft;
      }
    },
    onSuccess: (draft) => {
      setCurrentDraft(draft);
      setHasUnsavedChanges(false);
      if (draft.structured_data?.metadata?.selected_vendors) {
        setSelectedVendors(draft.structured_data.metadata.selected_vendors);
      }
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      showToast("Draft saved successfully!", "success");
    },
  });

  const { mutate: convertDraftToRfp, isPending: isConverting } = useMutation<
    Rfp,
    unknown,
    { draftId: string; description: string }
  >({
    mutationFn: async ({ draftId, description }) => {
      const response = await rfpApi.convertDraftToRfp(draftId, description);
      return response.data;
    },
    onSuccess: async (rfp) => {
      const hasValidData =
        (rfp.structured_data.budget !== null &&
          rfp.structured_data.budget !== undefined) ||
        (rfp.structured_data.items &&
          rfp.structured_data.items.length > 0 &&
          rfp.structured_data.items.some((item: any) => item?.name?.trim())) ||
        (rfp.structured_data.delivery_timeline &&
          rfp.structured_data.delivery_timeline.trim()) ||
        (rfp.structured_data.payment_terms &&
          rfp.structured_data.payment_terms.trim()) ||
        (rfp.structured_data.warranty && rfp.structured_data.warranty.trim());

      if (!hasValidData) {
        setValidationError(
          "The description provided is not detailed enough. Please provide more specific information including: items/products needed, quantities, budget, delivery timeline, payment terms, or warranty requirements."
        );
        setEmailPreview(null);
        return;
      }

      setCurrentRfp(rfp);
      setCurrentDraft(rfp);
      setEditDescription(rfp.description_raw);
      setIsEditing(false);
      setValidationError(null);
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      try {
        const previewResponse = await rfpApi.getEmailPreview(rfp.id);
        setEmailPreview(previewResponse.data);
      } catch (error) {
        console.error("Failed to fetch email preview", error);
      }
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to convert draft to RFP. Please check your description.";
      setValidationError(errorMessage);
    },
  });

  const {
    mutate: sendRfp,
    isPending: isSendingRfp,
    isError: sendRfpError,
  } = useMutation<void, unknown, SendRfpPayload>({
    mutationFn: async ({ rfp_id, vendor_ids }) => {
      const response = await rfpApi.send(rfp_id, vendor_ids);
      return response.data;
    },
    onSuccess: (data: any) => {
      const results = data || [];
      const successCount = results.filter((r: any) => r.success).length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        showToast(
          `RFP sent successfully to ${successCount} vendor(s)!`,
          "success"
        );
        setEmailSent(true);
        if (currentDraft) {
          setCurrentDraft(null);
        }
        queryClient.invalidateQueries({ queryKey: ["drafts"] });
        setTimeout(() => {
          navigate("/home");
        }, 1500);
      } else {
        showToast(
          `RFP sent to ${successCount} vendor(s), ${failCount} failed.`,
          "warning"
        );
        console.log("Send results:", results);
        if (successCount > 0) {
          setEmailSent(true);
          if (currentDraft) {
            setCurrentDraft(null);
          }
          queryClient.invalidateQueries({ queryKey: ["drafts"] });
          setTimeout(() => {
            navigate("/home");
          }, 1500);
        }
      }
    },
  });

  const handleCreateRfp = () => {
    const trimmed = description.trim();

    if (!trimmed) {
      setValidationError("Please enter an RFP description");
      return;
    }

    if (currentDraft) {
      convertDraftToRfp({ draftId: currentDraft.id, description: trimmed });
    } else {
      setValidationError(null);
      createRfp({ description: trimmed });
    }
  };

  const handleSaveDraft = () => {
    const trimmed = description.trim();

    if (!trimmed) {
      setValidationError("Please enter a description to save as draft");
      return;
    }

    setValidationError(null);
    createDraft({
      description: trimmed,
      selected_vendors: selectedVendors,
    });
  };

  const handleRegenerate = () => {
    if (!currentRfp) return;
    regenerateRfp(currentRfp.id);
  };

  const handleEdit = () => {
    if (!currentRfp) return;
    setEditDescription(currentRfp.description_raw);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditDescription("");
  };

  const handleSaveEdit = () => {
    if (!currentRfp) return;

    const trimmed = editDescription.trim();

    if (!trimmed) {
      setValidationError("Please enter an RFP description");
      return;
    }

    setValidationError(null);
    updateRfp({ id: currentRfp.id, description: trimmed });
  };

  const handleVendorChange = (_event: any, newValue: Vendor[]) => {
    setSelectedVendors(newValue.map((v) => v.id));
  };

  const handleSendRfp = () => {
    if (!currentRfp) return;

    if (selectedVendors.length === 0) {
      showToast("Please select at least one vendor", "warning");
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleConfirmSend = () => {
    if (!currentRfp) return;
    setConfirmDialogOpen(false);
    sendRfp({ rfp_id: currentRfp.id, vendor_ids: selectedVendors });
  };

  const handleCancelSend = () => {
    setConfirmDialogOpen(false);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
  };

  const getSelectedVendorEmails = (): string[] => {
    return vendors
      .filter((vendor) => selectedVendors.includes(vendor.id))
      .map((vendor) => vendor.email);
  };

  const isDescriptionEmpty = !description.trim();
  const hasVendors = vendors.length > 0;

  const isDraftMode = !!currentDraft || !!draftId;
  const showDraftWarning = hasUnsavedChanges && !currentRfp && !currentDraft;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isDraftMode ? "Edit Draft" : "Create New RFP"}
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        {isDraftMode
          ? "Continue editing your draft. When ready, click 'Preview RFP Email' to generate structured data and preview."
          : "Describe your requirements in simple language. We'll convert it into a structured RFP and show you the email preview."}
      </Typography>

      {showDraftWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          You have unsaved changes. If you leave this page, your changes will be
          lost. Consider saving as a draft.
        </Alert>
      )}

      {currentDraft && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You are editing a draft. Click "Preview RFP Email" to generate
          structured data and preview the email, or "Save as Draft" to save your
          changes.
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">RFP Description</Typography>
          {currentRfp && !emailSent && (
            <Button
              variant="outlined"
              size="small"
              onClick={isEditing ? handleCancelEdit : handleEdit}
              startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
            >
              {isEditing ? "Cancel" : "Edit Description"}
            </Button>
          )}
        </Box>
        <TextField
          fullWidth
          multiline
          rows={8}
          label="RFP Description"
          placeholder="Example: I need 100 laptops with 16GB RAM, delivery within 30 days, budget $50,000. Payment terms: Net 30. Warranty: 2 years."
          value={isEditing && currentRfp ? editDescription : description}
          onChange={(event) => {
            setValidationError(null);
            if (isEditing) {
              setEditDescription(event.target.value);
            } else {
              setDescription(event.target.value);
              if (!currentRfp && !currentDraft) {
                setHasUnsavedChanges(true);
              }
            }
          }}
          sx={{ mb: 2 }}
          disabled={!!currentRfp && !isEditing}
          helperText="Describe your requirements in detail. Include items, quantities, budget, delivery timeline, payment terms, or warranty requirements"
        />

        {!currentRfp && (
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Button
              variant="contained"
              onClick={handleCreateRfp}
              disabled={isCreatingRfp || isConverting || isDescriptionEmpty}
              startIcon={
                isCreatingRfp || isConverting ? (
                  <CircularProgress size={20} />
                ) : (
                  <SendIcon />
                )
              }
            >
              {isConverting
                ? "Generating Preview..."
                : isCreatingRfp
                  ? "Generating Preview..."
                  : isDraftMode
                    ? "Preview RFP Email from Draft"
                    : "Preview RFP Email"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isDescriptionEmpty}
              startIcon={
                isSavingDraft ? (
                  <CircularProgress size={20} />
                ) : (
                  <SaveOutlinedIcon />
                )
              }
            >
              {isSavingDraft ? "Saving..." : "Save as Draft"}
            </Button>
          </Box>
        )}

        {isEditing && currentRfp && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSaveEdit}
              disabled={isUpdatingRfp || !editDescription.trim()}
              startIcon={
                isUpdatingRfp ? <CircularProgress size={20} /> : <SaveIcon />
              }
            >
              {isUpdatingRfp ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCancelEdit}
              disabled={isUpdatingRfp}
            >
              Cancel
            </Button>
          </Box>
        )}

        {validationError && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {validationError}
          </Alert>
        )}
        {createRfpError && !validationError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to create RFP. Please try again.
          </Alert>
        )}
      </Paper>

      {vendorsError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load vendors. Please refresh the page.
        </Alert>
      )}
      {draftLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {draftError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load draft. Please try again.
        </Alert>
      )}

      {currentRfp && !validationError && (
        <>
          <Grid container spacing={3} sx={{ mb: 3, alignItems: "stretch" }}>
            <Grid item xs={12} md={6} sx={{ display: "flex" }}>
              <Paper
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Structured RFP Data</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleRegenerate}
                    disabled={isRegenerating || emailSent || isUpdatingRfp}
                    startIcon={
                      isRegenerating ? (
                        <CircularProgress size={16} />
                      ) : (
                        <RefreshIcon />
                      )
                    }
                    title={
                      emailSent ? "Cannot regenerate after email is sent" : ""
                    }
                  >
                    {isRegenerating ? "Regenerating..." : "Regenerate"}
                  </Button>
                </Box>
                {isUpdatingRfp ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flex: 1,
                      minHeight: "500px",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      minHeight: 0,
                      maxHeight: "600px",
                      overflow: "hidden",
                    }}
                  >
                    <pre
                      style={{
                        background: "#f5f5f5",
                        padding: "15px",
                        borderRadius: "4px",
                        overflow: "auto",
                        flex: 1,
                        margin: 0,
                        fontSize: "12px",
                        maxHeight: "100%",
                      }}
                    >
                      {JSON.stringify(currentRfp.structured_data, null, 2)}
                    </pre>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: "flex" }}>
              <Paper
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  height: "100%",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Email Preview</Typography>
                </Box>
                {isUpdatingRfp ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flex: 1,
                      minHeight: "500px",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : emailPreview ? (
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      minHeight: 0,
                      maxHeight: "600px",
                      overflow: "hidden",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Subject: {emailPreview.subject}
                    </Typography>
                    <Box
                      sx={{
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        p: 2,
                        overflow: "auto",
                        bgcolor: "#fff",
                        flex: 1,
                        maxHeight: "100%",
                      }}
                      dangerouslySetInnerHTML={{ __html: emailPreview.html }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flex: 1,
                      minHeight: "500px",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Vendors to Send RFP
            </Typography>

            {vendorsLoading ? (
              <CircularProgress />
            ) : !hasVendors ? (
              <Alert severity="info">
                No vendors available. Please add vendors first.
              </Alert>
            ) : (
              <>
                <Autocomplete
                  multiple
                  fullWidth
                  disablePortal
                  id="vendor-autocomplete"
                  options={vendors}
                  value={vendors.filter((v) => selectedVendors.includes(v.id))}
                  onChange={handleVendorChange}
                  disabled={emailSent}
                  getOptionLabel={(option) => option.name}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
                        </Typography>
                      </Box>
                    </li>
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.name}
                        onMouseDown={(event) => {
                          // prevent input from losing focus when clicking chip
                          event.stopPropagation();
                        }}
                      />
                    ))
                  }
                  sx={{ mb: 2 }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Vendors"
                      placeholder="Start typing vendor name or email..."
                    />
                  )}
                  ListboxProps={{
                    style: {
                      maxHeight: 300,
                      overflow: "auto",
                    },
                  }}
                />

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSendRfp}
                    disabled={
                      isSendingRfp ||
                      selectedVendors.length === 0 ||
                      emailSent ||
                      isEditing
                    }
                    startIcon={
                      isSendingRfp ? (
                        <CircularProgress size={20} />
                      ) : (
                        <SendIcon />
                      )
                    }
                    fullWidth
                    size="large"
                  >
                    {isSendingRfp
                      ? "Sending..."
                      : emailSent
                        ? "Email Already Sent"
                        : "Send Email to Selected Vendors"}
                  </Button>

                  {currentDraft && currentRfp && !isEditing && (
                    <Button
                      variant="outlined"
                      onClick={handleSaveDraft}
                      disabled={isSavingDraft || isDescriptionEmpty}
                      startIcon={
                        isSavingDraft ? (
                          <CircularProgress size={20} />
                        ) : (
                          <SaveOutlinedIcon />
                        )
                      }
                      size="large"
                    >
                      {isSavingDraft ? "Updating..." : "Update Draft"}
                    </Button>
                  )}
                </Box>

                {emailSent && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    RFP has been sent to vendors. Description cannot be edited
                    anymore.
                  </Alert>
                )}

                {sendRfpError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Failed to send RFP. Please try again.
                  </Alert>
                )}
              </>
            )}
          </Paper>

          <Dialog
            open={confirmDialogOpen}
            onClose={handleConfirmDialogClose}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Confirm Sending RFP Email</DialogTitle>
            <DialogContent>
              <DialogContentText gutterBottom>
                You are about to send this RFP email to the following vendors:
              </DialogContentText>
              <Box sx={{ mb: 2 }}>
                {getSelectedVendorEmails().map((email, index) => (
                  <Chip
                    key={index}
                    label={email}
                    color="primary"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Email Subject:
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {emailPreview?.subject || "N/A"}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Email Content Preview:
              </Typography>
              {emailPreview && (
                <Box
                  sx={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    p: 2,
                    maxHeight: "400px",
                    overflow: "auto",
                    bgcolor: "#fff",
                    mt: 1,
                  }}
                  dangerouslySetInnerHTML={{ __html: emailPreview.html }}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelSend} disabled={isSendingRfp}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSend}
                variant="contained"
                disabled={isSendingRfp}
                startIcon={
                  isSendingRfp ? <CircularProgress size={20} /> : <SendIcon />
                }
              >
                {isSendingRfp ? "Sending..." : "Confirm & Send"}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
}
