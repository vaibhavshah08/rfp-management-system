import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
  Card,
  CardContent,
  Button,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { proposalApi } from '../services/api';
import type { Proposal, ComparisonResult } from '../types';

export default function ProposalComparisonPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: proposals = [], isLoading: proposalsLoading } = useQuery<Proposal[]>({
    queryKey: ['proposals', id],
    queryFn: async () => {
      const response = await proposalApi.getByRfpId(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: comparison, isLoading: comparisonLoading } = useQuery<ComparisonResult>({
    queryKey: ['comparison', id],
    queryFn: async () => {
      const response = await proposalApi.compare(id!);
      return response.data;
    },
    enabled: !!id && proposals.length > 0,
  });

  if (proposalsLoading || comparisonLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (proposals.length === 0) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/rfp/${id}`)} sx={{ mb: 2 }}>
          Back to RFP
        </Button>
        <Alert severity="info">No proposals to compare.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/rfp/${id}`)} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h4">Proposal Comparison</Typography>
      </Box>

      {comparison && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            AI Analysis Summary
          </Typography>
          <Typography variant="body1" paragraph>
            {comparison.summary}
          </Typography>

          {comparison.recommended_vendor && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Recommended Vendor
              </Typography>
              <Chip
                label={
                  proposals.find((p) => p.vendor_id === comparison.recommended_vendor.vendor_id)?.vendor?.name ||
                  'Unknown'
                }
                color="success"
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {comparison.recommended_vendor.reason}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vendor</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Delivery Days</TableCell>
              <TableCell>Warranty</TableCell>
              <TableCell align="right">Completeness</TableCell>
              <TableCell align="right">Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {proposals.map((proposal) => {
              const score_data = comparison?.scores[proposal.vendor_id];
              return (
                <TableRow key={proposal.id}>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      {proposal.vendor?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {proposal.vendor?.email}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {proposal.structured_proposal.price
                      ? `$${proposal.structured_proposal.price.toLocaleString()}`
                      : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    {proposal.structured_proposal.delivery_days || 'N/A'}
                  </TableCell>
                  <TableCell>{proposal.structured_proposal.warranty || 'N/A'}</TableCell>
                  <TableCell align="right">
                    {proposal.structured_proposal.completeness !== undefined
                      ? `${proposal.structured_proposal.completeness}%`
                      : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    {score_data ? (
                      <Chip
                        label={score_data.score.toFixed(1)}
                        color={
                          score_data.score >= 70 ? 'success' : score_data.score >= 50 ? 'warning' : 'error'
                        }
                      />
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {comparison && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Detailed Scoring
          </Typography>
          {Object.entries(comparison.scores).map(([vendor_id, score_data]) => {
            const proposal = proposals.find((p) => p.vendor_id === vendor_id);
            return (
              <Card key={vendor_id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6">{proposal?.vendor?.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {score_data.reasoning}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}


