import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
} from "@mui/material";
import { Preview as PreviewIcon } from "@mui/icons-material";
import { emailApi, rfpApi } from "../services/api";

interface EmailRecord {
  id: string;
  rfp_id: string;
  vendor_id: string;
  recipient_email: string;
  subject: string;
  status: "pending" | "sent" | "failed";
  error_message?: string | null;
  sent_at?: string | null;
  created_at: string;
  rfp?: {
    id: string;
    description_raw: string;
    structured_data: any;
  };
  vendor?: {
    id: string;
    name: string;
    email: string;
  };
}

const generateSummary = (text: string): string => {
  if (!text) return "";
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= 3) return text;
  return words.slice(0, 3).join(" ") + "...";
};

export default function SentProposalsPage() {
  const [previewRfpId, setPreviewRfpId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const { data: emailRecords, isLoading, isError } = useQuery<EmailRecord[]>({
    queryKey: ["sent-emails"],
    queryFn: async () => {
      const response = await emailApi.getSent();
      return response.data;
    },
  });

  const handlePreview = async (rfp_id: string) => {
    setPreviewRfpId(rfp_id);
    setLoadingPreview(true);
    try {
      const response = await rfpApi.getById(rfp_id);
      const previewResponse = await rfpApi.getEmailPreview(rfp_id);
      setPreviewData({
        rfp: response.data,
        emailPreview: previewResponse.data,
      });
    } catch (error) {
      console.error("Failed to load preview", error);
      alert("Failed to load preview");
    } finally {
      setLoadingPreview(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load sent proposals. Please try again.
      </Alert>
    );
  }

  const records = emailRecords || [];

  const grouped_by_rfp = records.reduce((acc, record) => {
    const rfp_id = record.rfp_id;
    if (!acc[rfp_id]) {
      acc[rfp_id] = [];
    }
    acc[rfp_id].push(record);
    return acc;
  }, {} as Record<string, EmailRecord[]>);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Sent Proposals ({records.length})
      </Typography>

      {records.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center", mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No sent proposals yet
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {Object.entries(grouped_by_rfp).map(([rfp_id, rfp_records]) => {
            const rfp = rfp_records[0]?.rfp;
            const sent_count = rfp_records.filter((r) => r.status === "sent").length;
            const failed_count = rfp_records.filter((r) => r.status === "failed").length;
            const pending_count = rfp_records.filter((r) => r.status === "pending").length;

            return (
              <Card key={rfp_id} variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {generateSummary(rfp?.description_raw || "")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rfp_records.length} vendor(s)
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PreviewIcon />}
                        onClick={() => handlePreview(rfp_id)}
                      >
                        Preview
                      </Button>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {sent_count > 0 && (
                          <Chip label={sent_count} color="success" size="small" sx={{ minWidth: "40px" }} />
                        )}
                        {pending_count > 0 && (
                          <Chip label={pending_count} color="warning" size="small" sx={{ minWidth: "40px" }} />
                        )}
                        {failed_count > 0 && (
                          <Chip label={failed_count} color="error" size="small" sx={{ minWidth: "40px" }} />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>Vendor</TableCell>
                          <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>Status</TableCell>
                          <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>Sent At</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rfp_records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>
                              {record.vendor?.name || record.recipient_email}
                            </TableCell>
                            <TableCell sx={{ py: 0.5 }}>
                              <Chip
                                label={record.status}
                                color={
                                  record.status === "sent"
                                    ? "success"
                                    : record.status === "failed"
                                    ? "error"
                                    : "warning"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>
                              {record.sent_at
                                ? new Date(record.sent_at).toLocaleDateString()
                                : record.status === "pending"
                                ? "Pending"
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {rfp_records.some((r) => r.error_message) && (
                    <Box sx={{ mt: 1 }}>
                      {rfp_records
                        .filter((r) => r.error_message)
                        .map((record) => (
                          <Typography key={record.id} variant="caption" color="error" display="block">
                            {record.vendor?.name}: {record.error_message}
                          </Typography>
                        ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog open={!!previewRfpId} onClose={() => setPreviewRfpId(null)} maxWidth="md" fullWidth>
        <DialogTitle>RFP Preview</DialogTitle>
        <DialogContent>
          {loadingPreview ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : previewData ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" paragraph>
                {previewData.rfp.description_raw}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Structured Data
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {previewData.rfp.structured_data.budget && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Budget
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ${previewData.rfp.structured_data.budget.toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {previewData.rfp.structured_data.delivery_timeline && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Delivery Timeline
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {previewData.rfp.structured_data.delivery_timeline}
                    </Typography>
                  </Grid>
                )}
                {previewData.rfp.structured_data.payment_terms && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Payment Terms
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {previewData.rfp.structured_data.payment_terms}
                    </Typography>
                  </Grid>
                )}
                {previewData.rfp.structured_data.warranty && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Warranty
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {previewData.rfp.structured_data.warranty}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {previewData.rfp.structured_data.items && previewData.rfp.structured_data.items.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Items Required
                  </Typography>
                  {previewData.rfp.structured_data.items.map((item: any, idx: number) => (
                    <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                      • {item.name} - Quantity: {item.quantity}
                      {item.specifications && ` (${item.specifications})`}
                    </Typography>
                  ))}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Email Preview
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Subject: {previewData.emailPreview.subject}
              </Typography>
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
                dangerouslySetInnerHTML={{ __html: previewData.emailPreview.html }}
              />
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewRfpId(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
