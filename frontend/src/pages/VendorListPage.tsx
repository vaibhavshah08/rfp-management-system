import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { vendorApi } from '../services/api';
import type { Vendor, CreateVendorDto } from '../types';
import { useToast } from '../contexts/ToastContext';

export default function VendorListPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState<CreateVendorDto>({
    name: '',
    email: '',
    metadata: {},
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: vendorsData, isLoading, isError } = useQuery<Vendor[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      try {
        const response = await vendorApi.getAll();
        const data = response.data;
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('Error fetching vendors:', err);
        return [];
      }
    },
  });

  const vendors = Array.isArray(vendorsData) ? vendorsData : [];

  const createMutation = useMutation({
    mutationFn: (data: CreateVendorDto) => vendorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setOpen(false);
      resetForm();
      showToast('Vendor created successfully!', 'success');
    },
    onError: (error: any) => {
      const error_message = error?.response?.data?.message || 'Failed to create vendor';
      if (error_message.includes('email already exists')) {
        setFormError('A vendor with this email already exists');
      } else {
        showToast(error_message, 'error');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateVendorDto> }) =>
      vendorApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setOpen(false);
      resetForm();
      showToast('Vendor updated successfully!', 'success');
    },
    onError: (error: any) => {
      const error_message = error?.response?.data?.message || 'Failed to update vendor';
      if (error_message.includes('email already exists')) {
        setFormError('A vendor with this email already exists');
      } else {
        showToast(error_message, 'error');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      showToast('Vendor deleted successfully!', 'success');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 'Failed to delete vendor';
      showToast(errorMessage, 'error');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', metadata: {} });
    setEditingVendor(null);
    setFormError(null);
  };

  const handleOpen = (vendor?: Vendor) => {
    setFormError(null);
    if (vendor) {
      setEditingVendor(vendor);
      setFormData({
        name: vendor.name,
        email: vendor.email,
        metadata: vendor.metadata || {},
      });
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
    setFormError(null);
  };

  const handleSubmit = () => {
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Please enter a vendor name');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (editingVendor) {
      updateMutation.mutate({ id: editingVendor.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Vendors</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Vendor
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <Typography>Loading vendors...</Typography>
        </Box>
      ) : isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load vendors. Please try again.
        </Alert>
      ) : !vendors || vendors.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            No vendors present
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please add a vendor to get started with RFP management.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Your First Vendor
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Proposals</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.proposals?.length || 0}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpen(vendor)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this vendor?')) {
                          deleteMutation.mutate(vendor.id);
                        }
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Vendor Name"
              placeholder="Enter vendor name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              placeholder="vendor@example.com"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setFormError(null);
              }}
              margin="normal"
              required
              error={!!formError}
              helperText={formError}
            />
            <TextField
              fullWidth
              label="Metadata (JSON)"
              placeholder='{"industry": "Technology", "rating": 4.5}'
              value={JSON.stringify(formData.metadata || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : {};
                  setFormData({ ...formData, metadata: parsed });
                } catch (error) {
                }
              }}
              margin="normal"
              multiline
              rows={4}
              helperText="Optional: Add additional metadata as JSON (e.g., industry, rating, etc.)"
              error={(() => {
                try {
                  JSON.parse(JSON.stringify(formData.metadata || {}, null, 2));
                  return false;
                } catch {
                  return false;
                }
              })()}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.email || createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : editingVendor
              ? 'Update Vendor'
              : 'Create Vendor'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


