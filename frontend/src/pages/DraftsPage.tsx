import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { rfpApi } from "../services/api";
import type { Rfp } from "../types";

const generateSummary = (text: string): string => {
  if (!text) return "";
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length <= 10) return text;
  return words.slice(0, 10).join(" ") + "...";
};

export default function DraftsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  const { data: drafts = [], isLoading, isError } = useQuery<Rfp[]>({
    queryKey: ["drafts"],
    queryFn: async () => {
      const response = await rfpApi.getAllDrafts();
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rfpApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      setDeleteDialogOpen(false);
      setDraftToDelete(null);
    },
  });

  const handleEdit = (draftId: string) => {
    navigate(`/?draft=${draftId}`);
  };

  const handleDelete = (draftId: string) => {
    setDraftToDelete(draftId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (draftToDelete) {
      deleteMutation.mutate(draftToDelete);
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
        Failed to load drafts. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">Drafts ({drafts.length})</Typography>
        <Button
          variant="contained"
          startIcon={<DescriptionIcon />}
          onClick={() => navigate("/")}
        >
          Create New Draft
        </Button>
      </Box>

      {drafts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center", mt: 2 }}>
          <DescriptionIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No drafts yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start creating an RFP and save it as a draft to continue later
          </Typography>
          <Button variant="contained" onClick={() => navigate("/")}>
            Create Your First Draft
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {drafts.map((draft) => (
            <Card key={draft.id} variant="outlined" sx={{ "&:hover": { boxShadow: 2 } }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {generateSummary(draft.description_raw)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {draft.description_raw}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
                      <Chip label="Draft" size="small" color="warning" />
                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(draft.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(draft.id)}
                    >
                      Continue Editing
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(draft.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Draft?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this draft? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

