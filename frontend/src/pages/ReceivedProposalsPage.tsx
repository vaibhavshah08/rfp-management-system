import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import { CompareArrows as CompareIcon, Preview as PreviewIcon } from "@mui/icons-material";
import { proposalApi } from "../services/api";
import type { Proposal } from "../types";

const generateSummary = (text: string): string => {
  if (!text) return "";
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= 3) return text;
  return words.slice(0, 3).join(" ") + "...";
};

export default function ReceivedProposalsPage() {
  const navigate = useNavigate();
  const [previewProposal, setPreviewProposal] = useState<Proposal | null>(null);

  const { data: proposals = [], isLoading, isError } = useQuery<Proposal[]>({
    queryKey: ["proposals"],
    queryFn: async () => {
      const response = await proposalApi.getAll();
      return response.data;
    },
  });

  const proposals_by_rfp = proposals.reduce((acc, proposal) => {
    const rfp_id = proposal.rfp_id;
    if (!acc[rfp_id]) {
      acc[rfp_id] = [];
    }
    acc[rfp_id].push(proposal);
    return acc;
  }, {} as Record<string, Proposal[]>);

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
        Failed to load proposals. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Received Proposals ({proposals.length})
      </Typography>

      {proposals.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center", mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            No proposals received yet
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {Object.entries(proposals_by_rfp).map(([rfp_id, rfp_proposals]) => {
            const rfp = rfp_proposals[0]?.rfp;

            return (
              <Card key={rfp_id} variant="outlined">
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {generateSummary(rfp?.description_raw || "")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rfp_proposals.length} proposal{rfp_proposals.length > 1 ? "s" : ""}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      {rfp_proposals.length > 1 && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CompareIcon />}
                          onClick={() => navigate(`/rfp/${rfp_id}/compare`)}
                        >
                          Compare
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <TableContainer sx={{ maxHeight: "300px", overflow: "auto" }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>Vendor</TableCell>
                          <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }} align="right">Price</TableCell>
                          <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }} align="right">Delivery</TableCell>
                          <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>Score</TableCell>
                          <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }} align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rfp_proposals.map((proposal) => (
                          <TableRow key={proposal.id}>
                            <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }}>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {proposal.vendor?.name || "Unknown Vendor"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {proposal.vendor?.email}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }} align="right">
                              {proposal.structured_proposal.price
                                ? `$${proposal.structured_proposal.price.toLocaleString()}`
                                : "N/A"}
                            </TableCell>
                            <TableCell sx={{ py: 0.5, fontSize: "0.75rem" }} align="right">
                              {proposal.structured_proposal.delivery_days
                                ? `${proposal.structured_proposal.delivery_days} days`
                                : "N/A"}
                            </TableCell>
                            <TableCell sx={{ py: 0.5 }}>
                              {proposal.score !== undefined ? (
                                <Chip
                                  label={proposal.score.toFixed(1)}
                                  color={proposal.score >= 70 ? "success" : proposal.score >= 50 ? "warning" : "error"}
                                  size="small"
                                />
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell sx={{ py: 0.5 }} align="right">
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PreviewIcon />}
                                onClick={() => setPreviewProposal(proposal)}
                              >
                                Preview
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog open={!!previewProposal} onClose={() => setPreviewProposal(null)} maxWidth="md" fullWidth>
        <DialogTitle>Proposal Preview</DialogTitle>
        <DialogContent>
          {previewProposal && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {previewProposal.vendor?.name || "Unknown Vendor"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {previewProposal.vendor?.email}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                {previewProposal.structured_proposal.price && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Price
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      ${previewProposal.structured_proposal.price.toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {previewProposal.structured_proposal.delivery_days && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Delivery
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {previewProposal.structured_proposal.delivery_days} days
                    </Typography>
                  </Grid>
                )}
                {previewProposal.structured_proposal.warranty && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Warranty
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {previewProposal.structured_proposal.warranty}
                    </Typography>
                  </Grid>
                )}
                {previewProposal.structured_proposal.completeness !== undefined && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Completeness
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {previewProposal.structured_proposal.completeness}%
                    </Typography>
                  </Grid>
                )}
                {previewProposal.score !== undefined && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Score
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {previewProposal.score.toFixed(1)}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {previewProposal.structured_proposal.items && previewProposal.structured_proposal.items.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Items
                  </Typography>
                  {previewProposal.structured_proposal.items.map((item: any, idx: number) => (
                    <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                      • {item.name} - Quantity: {item.quantity}
                      {item.unit_price && ` - $${item.unit_price.toLocaleString()}/unit`}
                      {item.total_price && ` (Total: $${item.total_price.toLocaleString()})`}
                    </Typography>
                  ))}
                </Box>
              )}

              {previewProposal.structured_proposal.notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Notes
                  </Typography>
                  <Typography variant="body2">{previewProposal.structured_proposal.notes}</Typography>
                </Box>
              )}

              {previewProposal.ai_summary && (
                <Box sx={{ mb: 2 }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    AI Summary
                  </Typography>
                  <Typography variant="body2">{previewProposal.ai_summary}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.secondary">
                RFP: {previewProposal.rfp?.description_raw || previewProposal.rfp_id}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewProposal(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
