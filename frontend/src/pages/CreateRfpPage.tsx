import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Grid,
  Divider,
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

  const {
    data: vendors = [],
    isLoading: vendorsLoading,
    isError: vendorsError,
  } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: async () => {
      const response = await vendorApi.getAll();
      return response.data;
    },
  });

  const { data: draftData } = useQuery<Rfp>({
    queryKey: ["draft", draftId],
    queryFn: async () => {
      if (!draftId) return null;
      const response = await rfpApi.getById(draftId);
      return response.data;
    },
    enabled: !!draftId,
  });

  useEffect(() => {
    if (draftData && draftData.is_draft) {
      setCurrentDraft(draftData);
      setDescription(draftData.description_raw);
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
    { description: string }
  >({
    mutationFn: async (payload) => {
      if (currentDraft) {
        const response = await rfpApi.updateDraft(currentDraft.id, payload);
        return response.data;
      } else {
        const response = await rfpApi.createDraft(payload);
        return response.data;
      }
    },
    onSuccess: (draft) => {
      setCurrentDraft(draft);
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      alert("Draft saved successfully!");
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
        alert(`RFP sent successfully to ${successCount} vendor(s)!`);
        setEmailSent(true);
        if (currentDraft) {
          setCurrentDraft(null);
        }
        queryClient.invalidateQueries({ queryKey: ["drafts"] });
      } else {
        alert(
          `RFP sent to ${successCount} vendor(s), ${failCount} failed. Check details in console.`
        );
        console.log("Send results:", results);
        if (successCount > 0) {
          setEmailSent(true);
          if (currentDraft) {
            setCurrentDraft(null);
          }
          queryClient.invalidateQueries({ queryKey: ["drafts"] });
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
    createDraft({ description: trimmed });
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

  const toggleVendorSelection = (vendor_id: string) => {
    setSelectedVendors((prevSelected) =>
      prevSelected.includes(vendor_id)
        ? prevSelected.filter((id) => id !== vendor_id)
        : [...prevSelected, vendor_id]
    );
  };

  const handleSendRfp = () => {
    if (!currentRfp) return;

    if (selectedVendors.length === 0) {
      alert("Please select at least one vendor");
      return;
    }

    sendRfp({ rfp_id: currentRfp.id, vendor_ids: selectedVendors });
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
          disabled={!!currentRfp && !isEditing && !isDraftMode}
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

      {currentRfp && !validationError && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
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
                      minHeight: "200px",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <pre
                    style={{
                      background: "#f5f5f5",
                      padding: "15px",
                      borderRadius: "4px",
                      overflow: "auto",
                      maxHeight: "500px",
                      fontSize: "12px",
                    }}
                  >
                    {JSON.stringify(currentRfp.structured_data, null, 2)}
                  </pre>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Email Preview
                </Typography>
                {isUpdatingRfp ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "200px",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : emailPreview ? (
                  <Box>
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
                        maxHeight: "500px",
                        overflow: "auto",
                        bgcolor: "#fff",
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
                      minHeight: "200px",
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
                <List>
                  {vendors.map((vendor) => {
                    const isSelected = selectedVendors.includes(vendor.id);

                    return (
                      <ListItemButton
                        key={vendor.id}
                        onClick={() => toggleVendorSelection(vendor.id)}
                        selected={isSelected}
                      >
                        <ListItemText
                          primary={vendor.name}
                          secondary={vendor.email}
                        />
                        {isSelected && (
                          <Chip label="Selected" color="primary" size="small" />
                        )}
                      </ListItemButton>
                    );
                  })}
                </List>

                <Divider sx={{ my: 2 }} />

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
                    isSendingRfp ? <CircularProgress size={20} /> : <SendIcon />
                  }
                >
                  {isSendingRfp
                    ? "Sending..."
                    : emailSent
                      ? "Email Already Sent"
                      : "Send Email to Selected Vendors"}
                </Button>

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
        </>
      )}
    </Box>
  );
}
