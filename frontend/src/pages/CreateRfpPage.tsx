import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  const [description, setDescription] = useState("");
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [currentRfp, setCurrentRfp] = useState<Rfp | null>(null);
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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
        resetForm();
      } else {
        alert(
          `RFP sent to ${successCount} vendor(s), ${failCount} failed. Check details in console.`
        );
        console.log("Send results:", results);
        if (successCount > 0) {
          resetForm();
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

    setValidationError(null);
    createRfp({ description: trimmed });
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

  const resetForm = () => {
    setDescription("");
    setCurrentRfp(null);
    setEmailPreview(null);
    setSelectedVendors([]);
    setIsEditing(false);
    setEditDescription("");
    setEmailSent(false);
    setValidationError(null);
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create New RFP
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Describe your requirements in simple language. We&apos;ll convert it
        into a structured RFP.
      </Typography>

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
            setValidationError(null); // Clear validation error when user types
            if (isEditing) {
              setEditDescription(event.target.value);
            } else {
              setDescription(event.target.value);
            }
          }}
          sx={{ mb: 2 }}
          disabled={!!currentRfp && !isEditing}
          helperText="Describe your requirements in detail. Include items, quantities, budget, delivery timeline, payment terms, or warranty requirements"
        />

        {!currentRfp && (
          <Button
            variant="contained"
            onClick={handleCreateRfp}
            disabled={isCreatingRfp || isDescriptionEmpty}
            startIcon={
              isCreatingRfp ? <CircularProgress size={20} /> : <SendIcon />
            }
          >
            {isCreatingRfp ? "Creating..." : "Create RFP"}
          </Button>
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
                    disabled={isRegenerating || emailSent}
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
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Email Preview
                </Typography>
                {emailPreview ? (
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
                  <CircularProgress size={24} />
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
