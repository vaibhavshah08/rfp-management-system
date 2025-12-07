import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import { CompareArrows as CompareIcon } from '@mui/icons-material';
import { rfpApi, proposalApi } from '../services/api';
import type { Rfp, Proposal } from '../types';

export default function RfpDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: rfp, isLoading } = useQuery<Rfp>({
    queryKey: ['rfp', id],
    queryFn: async () => {
      const response = await rfpApi.getById(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: ['proposals', id],
    queryFn: async () => {
      const response = await proposalApi.getByRfpId(id!);
      return response.data;
    },
    enabled: !!id,
  });


  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!rfp) {
    return <Alert severity="error">RFP not found</Alert>;
  }

  const { structured_data } = rfp;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">RFP Details</Typography>
        {proposals.length > 0 && (
          <Button
            variant="contained"
            startIcon={<CompareIcon />}
            onClick={() => navigate(`/rfp/${id}/compare`)}
          >
            Compare Proposals
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Description
        </Typography>
        <Typography variant="body1" paragraph>
          {rfp.description_raw}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" gutterBottom>
          Structured Information
        </Typography>

        {structured_data.budget && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Budget
            </Typography>
            <Typography variant="h6" color="primary">
              ${structured_data.budget.toLocaleString()}
            </Typography>
          </Box>
        )}

        {structured_data.items && structured_data.items.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Items Required
            </Typography>
            {structured_data.items.map((item, index) => (
              <Card key={index} sx={{ mb: 1 }}>
                <CardContent>
                  <Typography variant="body1" fontWeight="bold">
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {item.quantity}
                  </Typography>
                  {item.specifications && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {item.specifications}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {structured_data.delivery_timeline && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Delivery Timeline
            </Typography>
            <Typography variant="body1">{structured_data.delivery_timeline}</Typography>
          </Box>
        )}

        {structured_data.payment_terms && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Payment Terms
            </Typography>
            <Typography variant="body1">{structured_data.payment_terms}</Typography>
          </Box>
        )}

        {structured_data.warranty && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Warranty
            </Typography>
            <Typography variant="body1">{structured_data.warranty}</Typography>
          </Box>
        )}

        {structured_data.category && (
          <Box>
            <Chip label={structured_data.category} color="primary" />
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Proposals Received ({proposals.length})
        </Typography>
        {proposals.length === 0 ? (
          <Alert severity="info">No proposals received yet.</Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {proposals.map((proposal) => (
              <Card key={proposal.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box>
                      <Typography variant="h6">{proposal.vendor?.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {proposal.vendor?.email}
                      </Typography>
                    </Box>
                    {proposal.score !== undefined && (
                      <Chip
                        label={`Score: ${proposal.score.toFixed(1)}`}
                        color={proposal.score >= 70 ? 'success' : proposal.score >= 50 ? 'warning' : 'error'}
                      />
                    )}
                  </Box>
                  {proposal.structured_proposal.price && (
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      ${proposal.structured_proposal.price.toLocaleString()}
                    </Typography>
                  )}
                  {proposal.structured_proposal.delivery_days && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Delivery: {proposal.structured_proposal.delivery_days} days
                    </Typography>
                  )}
                  {proposal.ai_summary && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {proposal.ai_summary}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}


