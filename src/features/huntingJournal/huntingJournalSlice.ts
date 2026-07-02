import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HuntingJournalState, HuntingJournal } from './huntingJournalTypes';
import {
  createJournal,
  getAllJournals,
  getMyJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  searchJournals,
  shareJournal,
  getSharedWithMeJournals
} from './huntingJournalActions';

const initialState: HuntingJournalState = {
  journals: [],
  selectedJournal: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true,
  },
};

const huntingJournalSlice = createSlice({
  name: 'huntingJournal',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearJournals: (state) => {
      state.journals = [];
      state.selectedJournal = null;
      state.pagination.page = 1;
      state.pagination.hasMore = true;
    },
    setSelectedJournal: (state, action: PayloadAction<HuntingJournal | null>) => {
      state.selectedJournal = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Create Journal
    builder.addCase(createJournal.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createJournal.fulfilled, (state, action) => {
      state.isLoading = false;
      state.journals.unshift(action.payload);
      state.error = null;
    });
    builder.addCase(createJournal.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get All Journals
    builder.addCase(getAllJournals.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getAllJournals.fulfilled, (state, action) => {
      state.isLoading = false;
      state.journals = action.payload;
      state.pagination.total = action.payload.length;
      state.error = null;
    });
    builder.addCase(getAllJournals.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get My Journals
    builder.addCase(getMyJournals.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getMyJournals.fulfilled, (state, action) => {
      state.isLoading = false;
      state.journals = action.payload;
      state.pagination.total = action.payload.length;
      state.error = null;
    });
    builder.addCase(getMyJournals.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get Journal By ID
    builder.addCase(getJournalById.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getJournalById.fulfilled, (state, action) => {
      state.isLoading = false;
      state.selectedJournal = action.payload;
      state.error = null;
    });
    builder.addCase(getJournalById.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Update Journal
    builder.addCase(updateJournal.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(updateJournal.fulfilled, (state, action) => {
      state.isLoading = false;
      const index = state.journals.findIndex(j => j.id === action.payload.id);
      if (index !== -1) {
        state.journals[index] = action.payload;
      }
      if (state.selectedJournal?.id === action.payload.id) {
        state.selectedJournal = action.payload;
      }
      state.error = null;
    });
    builder.addCase(updateJournal.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Delete Journal
    builder.addCase(deleteJournal.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(deleteJournal.fulfilled, (state, action) => {
      state.isLoading = false;
      state.journals = state.journals.filter(j => j.id !== action.payload.id);
      if (state.selectedJournal?.id === action.payload.id) {
        state.selectedJournal = null;
      }
      state.error = null;
    });
    builder.addCase(deleteJournal.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Search Journals
    builder.addCase(searchJournals.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(searchJournals.fulfilled, (state, action) => {
      state.isLoading = false;
      state.journals = action.payload;
      state.error = null;
    });
    builder.addCase(searchJournals.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Share Journal
    builder.addCase(shareJournal.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(shareJournal.fulfilled, (state, action) => {
      state.isLoading = false;
      const index = state.journals.findIndex(j => j.id === action.payload.id);
      if (index !== -1) {
        state.journals[index] = action.payload; // Update shared counts / ids inside state
      }
      if (state.selectedJournal?.id === action.payload.id) {
        state.selectedJournal = action.payload;
      }
      state.error = null;
    });
    builder.addCase(shareJournal.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Get Shared With Me Journals
    builder.addCase(getSharedWithMeJournals.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getSharedWithMeJournals.fulfilled, (state, action) => {
      state.isLoading = false;
      state.journals = action.payload;
      state.pagination.total = action.payload.length;
      state.error = null;
    });
    builder.addCase(getSharedWithMeJournals.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, clearJournals, setSelectedJournal } = huntingJournalSlice.actions;
export const huntingJournalReducer = huntingJournalSlice.reducer;