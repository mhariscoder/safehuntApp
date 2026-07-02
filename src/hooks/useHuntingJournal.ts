import { useAppSelector, useAppDispatch } from '../app/store/hooks';
import {
  createJournal,
  getAllJournals,
  getMyJournals,
  getJournalById,
  updateJournal,
  deleteJournal,
  searchJournals,
  shareJournal,
  getSharedWithMeJournals,
} from '../features/huntingJournal/huntingJournalActions';
import {
  clearError,
  clearJournals,
  setSelectedJournal,
} from '../features/huntingJournal/huntingJournalSlice';
import { 
  CreateHuntingJournalData, 
  UpdateHuntingJournalData, 
  SearchHuntingJournalParams 
} from '../features/huntingJournal/huntingJournalTypes';

export const useHuntingJournal = () => {
  const dispatch = useAppDispatch();
  const { journals, selectedJournal, isLoading, error, pagination } = useAppSelector(
    (state) => state.huntingJournal
  );

  const handleCreateJournal = async (data: CreateHuntingJournalData) => {
    return dispatch(createJournal(data)).unwrap();
  };

  const handleGetAllJournals = async () => {
    return dispatch(getAllJournals()).unwrap();
  };

  const handleGetMyJournals = async (page?: number, limit?: number) => {
    return dispatch(getMyJournals({ page, limit })).unwrap();
  };

  const handleGetJournalById = async (id: number) => {
    return dispatch(getJournalById(id)).unwrap();
  };

  const handleUpdateJournal = async (data: UpdateHuntingJournalData) => {
    return dispatch(updateJournal(data)).unwrap();
  };

  const handleDeleteJournal = async (id: number) => {
    return dispatch(deleteJournal(id)).unwrap();
  };

  const handleSearchJournals = async (params: SearchHuntingJournalParams) => {
    return dispatch(searchJournals(params)).unwrap();
  };

  const handleShareJournal = async (id: number, friendId: number) => {
    return dispatch(shareJournal({ id, friendId })).unwrap();
  };

  const handleGetSharedWithMeJournals = async (page?: number, limit?: number) => {
    return dispatch(getSharedWithMeJournals({ page, limit })).unwrap();
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const handleClearJournals = () => {
    dispatch(clearJournals());
  };

  const handleSetSelectedJournal = (journal: any) => {
    dispatch(setSelectedJournal(journal));
  };

  return {
    // State
    journals,
    selectedJournal,
    isLoading,
    error,
    pagination,
    
    // Actions
    createJournal: handleCreateJournal,
    getAllJournals: handleGetAllJournals,
    getMyJournals: handleGetMyJournals,
    getJournalById: handleGetJournalById,
    updateJournal: handleUpdateJournal,
    deleteJournal: handleDeleteJournal,
    searchJournals: handleSearchJournals,
    shareJournal: handleShareJournal,                       
    getSharedWithMeJournals: handleGetSharedWithMeJournals,
    clearError: handleClearError,
    clearJournals: handleClearJournals,
    setSelectedJournal: handleSetSelectedJournal,
  };
};