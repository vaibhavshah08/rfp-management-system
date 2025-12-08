import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Grid,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { proposalApi } from "../services/api";
import type { Proposal, ComparisonResult } from "../types";

export default function ProposalComparisonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: proposals = [],
    isLoading: proposalsLoading,
    isError: proposalsError,
  } = useQuery<Proposal[]>({
    queryKey: ["proposals", id],
    queryFn: async () => {
      if (!id) throw new Error("RFP ID is required");
      try {
        const response = await proposalApi.getByRfpId(id);
        return response?.data || [];
      } catch (error: any) {
        throw new Error(
          error?.response?.data?.message || "Failed to load proposals"
        );
      }
    },
    enabled: !!id,
  });

  const {
    data: comparison,
    isLoading: comparisonLoading,
    isError: comparisonError,
  } = useQuery<ComparisonResult>({
    queryKey: ["comparison", id],
    queryFn: async () => {
      if (!id) throw new Error("RFP ID is required");
      try {
        const response = await proposalApi.compare(id);
        return response?.data;
      } catch (error: any) {
        throw new Error(
          error?.response?.data?.message || "Failed to compare proposals"
        );
      }
    },
    enabled: !!id && proposals.length > 0,
  });

  if (proposalsLoading || comparisonLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (proposalsError) {
    return (
      <Box sx={{ p: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/rfp/${id}`)}
          sx={{ mb: 2 }}
        >
          Back to RFP
        </Button>
        <Alert severity="error">
          Failed to load proposals. Please try again.
        </Alert>
      </Box>
    );
  }

  if (comparisonError) {
    return (
      <Box sx={{ p: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/rfp/${id}`)}
          sx={{ mb: 2 }}
        >
          Back to RFP
        </Button>
        <Alert severity="error">
          Failed to load comparison. Please try again.
        </Alert>
      </Box>
    );
  }

  if (proposals.length === 0) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/rfp/${id}`)}
          sx={{ mb: 2 }}
        >
          Back to RFP
        </Button>
        <Alert severity="info">No proposals to compare.</Alert>
      </Box>
    );
  }

  const recommended_vendor_id = comparison?.recommended_vendor?.vendor_id;
  const sorted_proposals = [...proposals].sort((a, b) => {
    const score_a = comparison?.scores?.[a?.vendor_id]?.score || 0;
    const score_b = comparison?.scores?.[b?.vendor_id]?.score || 0;
    return score_b - score_a;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/rfp/${id}`)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" fontWeight="bold">
          Proposal Comparison
        </Typography>
      </Box>

      {comparison && comparison.recommended_vendor && (
        <Paper
          sx={{
            p: 4,
            mb: 3,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            boxShadow: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <StarIcon sx={{ mr: 1.5, fontSize: "2.5rem" }} />
            <Typography variant="h4" fontWeight="bold">
              Which Vendor Should You Go With?
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              borderRadius: 2,
              p: 3,
              mb: 2,
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
              {proposals.find((p) => p?.vendor_id === recommended_vendor_id)
                ?.vendor?.name || "Unknown Vendor"}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                opacity: 0.98,
                lineHeight: 1.8,
                fontSize: "1.1rem",
                whiteSpace: "pre-line",
              }}
            >
              {comparison.recommended_vendor.reason}
            </Typography>
          </Box>

          {recommended_vendor_id && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                <strong>Vendor Contact:</strong>{" "}
                {proposals.find((p) => p?.vendor_id === recommended_vendor_id)
                  ?.vendor?.email || "N/A"}
              </Typography>
              {comparison?.scores?.[recommended_vendor_id]?.score !==
                undefined && (
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  <strong>Overall Score:</strong>{" "}
                  {comparison.scores[recommended_vendor_id].score.toFixed(1)}
                  /100
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      )}

      {comparison && comparison.recommended_vendor && recommended_vendor_id && (
        <Paper sx={{ p: 3, mb: 3, border: "2px solid #1976d2" }}>
          <Typography
            variant="h6"
            gutterBottom
            fontWeight="bold"
            color="primary"
          >
            Decision Support: Why This Recommendation?
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(() => {
              const recommended_proposal = proposals.find(
                (p) => p?.vendor_id === recommended_vendor_id
              );
              const recommended_score =
                comparison.scores?.[recommended_vendor_id];

              return (
                <>
                  {recommended_proposal?.structured_proposal?.price && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        💰 Price Advantage
                      </Typography>
                      <Typography variant="body2">
                        Total Price: ₹
                        {recommended_proposal.structured_proposal.price.toLocaleString(
                          "en-IN"
                        )}
                        {recommended_proposal.structured_proposal.notes
                          ?.toLowerCase()
                          .includes("discount") && (
                          <Chip
                            label="Discount Available"
                            color="success"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                    </Box>
                  )}

                  {recommended_proposal?.structured_proposal?.delivery_days && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        ⏱️ Delivery Timeline
                      </Typography>
                      <Typography variant="body2">
                        {recommended_proposal.structured_proposal.delivery_days}{" "}
                        days
                        {recommended_proposal.structured_proposal
                          .delivery_days <= 15 && (
                          <Chip
                            label="Fast Delivery"
                            color="success"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Typography>
                    </Box>
                  )}

                  {recommended_proposal?.structured_proposal?.warranty && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        🛡️ Warranty Coverage
                      </Typography>
                      <Typography variant="body2">
                        {recommended_proposal.structured_proposal.warranty}
                      </Typography>
                    </Box>
                  )}

                  {recommended_proposal?.structured_proposal?.completeness !==
                    undefined && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        ✅ Proposal Completeness
                      </Typography>
                      <Typography variant="body2">
                        {recommended_proposal.structured_proposal.completeness}%
                        -
                        {recommended_proposal.structured_proposal
                          .completeness >= 80
                          ? " Comprehensive proposal with all details"
                          : recommended_proposal.structured_proposal
                                .completeness >= 60
                            ? " Good proposal with most details"
                            : " Basic proposal"}
                      </Typography>
                    </Box>
                  )}

                  {recommended_proposal?.structured_proposal?.notes && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        📝 Additional Value
                      </Typography>
                      <Typography variant="body2">
                        {recommended_proposal.structured_proposal.notes}
                      </Typography>
                    </Box>
                  )}

                  {recommended_score?.score !== undefined && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        color="text.secondary"
                        gutterBottom
                      >
                        🎯 Overall Score
                      </Typography>
                      <Typography variant="body2">
                        {recommended_score.score.toFixed(1)}/100 -{" "}
                        {recommended_score.score >= 80
                          ? "Excellent choice"
                          : recommended_score.score >= 70
                            ? "Strong recommendation"
                            : recommended_score.score >= 60
                              ? "Good option"
                              : "Consider carefully"}
                      </Typography>
                    </Box>
                  )}
                </>
              );
            })()}
          </Box>
        </Paper>
      )}

      {comparison && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            AI Analysis Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography
            variant="body1"
            sx={{
              whiteSpace: "pre-line",
              lineHeight: 1.8,
            }}
          >
            {comparison.summary}
          </Typography>
        </Paper>
      )}

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Vendor
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Total Price
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Items
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Delivery
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Warranty
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Completeness
              </TableCell>
              <TableCell
                align="right"
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Overall Score
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", backgroundColor: "#f5f5f5" }}
              >
                Notes
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted_proposals.map((proposal, index) => {
              const score_data = comparison?.scores?.[proposal?.vendor_id];
              const is_recommended =
                proposal?.vendor_id === recommended_vendor_id;
              const items_count =
                proposal?.structured_proposal?.items?.length || 0;
              const items_summary =
                proposal?.structured_proposal?.items
                  ?.map(
                    (item: any) =>
                      `${item?.name || "Item"} (${item?.quantity || 0})`
                  )
                  .join(", ") || "N/A";

              return (
                <TableRow
                  key={proposal.id}
                  sx={{
                    backgroundColor: is_recommended
                      ? "#f0f7ff"
                      : index % 2 === 0
                        ? "#fafafa"
                        : "white",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                    borderLeft: is_recommended ? "4px solid #1976d2" : "none",
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {is_recommended && (
                        <CheckCircleIcon color="primary" fontSize="small" />
                      )}
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {proposal?.vendor?.name || "Unknown Vendor"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {proposal?.vendor?.email || "No email"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {proposal?.structured_proposal?.price ? (
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color="primary"
                      >
                        ₹
                        {proposal.structured_proposal.price.toLocaleString(
                          "en-IN"
                        )}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {items_count} item{items_count !== 1 ? "s" : ""}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={items_summary}
                      >
                        {items_summary}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {proposal?.structured_proposal?.delivery_days ? (
                      <Typography variant="body1">
                        {proposal.structured_proposal.delivery_days} days
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={proposal?.structured_proposal?.warranty || "N/A"}
                    >
                      {proposal?.structured_proposal?.warranty || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {proposal?.structured_proposal?.completeness !==
                      undefined &&
                    proposal.structured_proposal.completeness !== null ? (
                      <Chip
                        label={`${proposal.structured_proposal.completeness}%`}
                        size="small"
                        color={
                          proposal.structured_proposal.completeness >= 80
                            ? "success"
                            : proposal.structured_proposal.completeness >= 60
                              ? "warning"
                              : "error"
                        }
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {score_data?.score !== undefined &&
                    score_data.score !== null ? (
                      <Chip
                        label={`${score_data.score.toFixed(1)}/100`}
                        color={
                          score_data.score >= 70
                            ? "success"
                            : score_data.score >= 50
                              ? "warning"
                              : "error"
                        }
                        sx={{ fontWeight: "bold", fontSize: "0.875rem" }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "block",
                        maxWidth: "250px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={proposal?.structured_proposal?.notes || "N/A"}
                    >
                      {proposal?.structured_proposal?.notes || "N/A"}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {comparison && (
        <Grid container spacing={2}>
          {Object.entries(comparison?.scores || {}).map(
            ([vendor_id, score_data]) => {
              const proposal = sorted_proposals.find(
                (p) => p?.vendor_id === vendor_id
              );
              if (!proposal || !score_data) return null;

              return (
                <Grid item xs={12} md={6} key={vendor_id}>
                  <Paper sx={{ p: 2, height: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {proposal?.vendor?.name || "Unknown Vendor"}
                      </Typography>
                      {score_data?.score !== undefined &&
                      score_data.score !== null ? (
                        <Chip
                          label={`Score: ${score_data.score.toFixed(1)}`}
                          color={
                            score_data.score >= 70
                              ? "success"
                              : score_data.score >= 50
                                ? "warning"
                                : "error"
                          }
                          size="small"
                        />
                      ) : null}
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        whiteSpace: "pre-line",
                        lineHeight: 1.6,
                      }}
                    >
                      {score_data?.reasoning || "No reasoning provided"}
                    </Typography>
                  </Paper>
                </Grid>
              );
            }
          )}
        </Grid>
      )}
    </Box>
  );
}
