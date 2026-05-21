export interface HuntingJournal {
  id: number;
  title: string;
  date: string;
  description: string;
  location: {
    locationText: string;
    latitude: number;
    longitude: number;
  };
  weather: string;
  user: {
    id: number;
    username: string;
    displayname: string;
    profilePhoto?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HuntingJournalState {
  journals: HuntingJournal[];
  selectedJournal: HuntingJournal | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CreateHuntingJournalData {
  title: string;
  date: string;
  description: string;
  location: {
    locationText: string;
    latitude: number;
    longitude: number;
  };
  weather: string;
}

export interface UpdateHuntingJournalData {
  id: number;
  title?: string;
  date?: string;
  description?: string;
  location?: {
    locationText: string;
    latitude: number;
    longitude: number;
  };
  weather?: string;
}

export interface SearchHuntingJournalParams {
  title?: string;
  description?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}