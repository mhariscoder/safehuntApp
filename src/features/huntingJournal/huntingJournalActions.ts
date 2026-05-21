import { createAsyncThunk } from '@reduxjs/toolkit';
import huntingJournalService from './huntingJournalService';
import { 
  CreateHuntingJournalData, 
  UpdateHuntingJournalData, 
  SearchHuntingJournalParams 
} from './huntingJournalTypes';

// Create a new journal entry
export const createJournal = createAsyncThunk(
  'huntingJournal/create',
  async (data: CreateHuntingJournalData, { rejectWithValue }) => {
    try {
      const response = await huntingJournalService.createJournal(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create journal entry');
    }
  }
);

// Get all journals
export const getAllJournals = createAsyncThunk(
  'huntingJournal/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await huntingJournalService.getAllJournals();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch journals');
    }
  }
);

// Get my journals
export const getMyJournals = createAsyncThunk(
  'huntingJournal/getMyJournals',
  async ({ page, limit }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await huntingJournalService.getMyJournals(page, limit);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your journals');
    }
  }
);

// Get journal by ID
export const getJournalById = createAsyncThunk(
  'huntingJournal/getById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await huntingJournalService.getJournalById(id);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch journal');
    }
  }
);

// Update journal
export const updateJournal = createAsyncThunk(
  'huntingJournal/update',
  async (data: UpdateHuntingJournalData, { rejectWithValue }) => {
    try {
      const response = await huntingJournalService.updateJournal(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update journal');
    }
  }
);

// Delete journal
export const deleteJournal = createAsyncThunk(
  'huntingJournal/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await huntingJournalService.deleteJournal(id);
      return { id };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete journal');
    }
  }
);

// Search journals
export const searchJournals = createAsyncThunk(
  'huntingJournal/search',
  async (params: SearchHuntingJournalParams, { rejectWithValue }) => {
    try {
      const response = await huntingJournalService.searchJournals(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search journals');
    }
  }
);