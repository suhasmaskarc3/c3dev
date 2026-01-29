import React, { useState, useEffect } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Select, MenuItem, FormControl } from '@mui/material';

import PageContainer from '@c3/app/ui/src/components/container/PageContainer';
import ContentSection from '@c3/app/ui/src/components/container/ContentSection';
import {
  getEarliestOperationDate,
  getLatestEndDate,
  fetchCountWithFilter,
} from '@c3/app/ui/src/components/CRUDMethods/OperationCRUD';
import { getUniqueBaseIds } from '@c3/app/ui/src/components/CRUDMethods/BaseCRUD';
import LoadingAnimation from '@c3/app/ui/src/components/misc/LoadingAnimation';
import ErrorModal from '@c3/app/ui/src/components/misc/ErrorModal';
import OperationsPaginatedTable from '@c3/app/ui/src/components/table/OperationsPaginatedTable';
import KPIStatsContainer from '@c3/app/ui/src/components/stats/KPIStatsContainer';
import KPIStatsTile from '@c3/app/ui/src/components/stats/KPIStatsTile';
import { ThemeProvider, useTheme } from '@c3/app/ui/src/contexts/ThemeContext';

interface ContentHeaderProps {
  title: string;
}

const ContentHeader = ({ title }: ContentHeaderProps) => {
  const { theme } = useTheme();

  return (
    <div style={{ marginBottom: '16px' }}>
      <h1
        style={{
          margin: 0,
          fontWeight: 700,
          fontSize: '2rem',
          color: theme.text,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h1>
    </div>
  );
};

interface ContentDescriptionProps {
  description: string;
}

const ContentDescription = ({ description }: ContentDescriptionProps) => {
  const { theme } = useTheme();

  return <p style={{ color: theme.textSecondary, fontSize: '1.125rem', margin: 0, lineHeight: '1.6' }}>{description}</p>;
};

interface FilterSectionProps {
  minDate?: Date | null;
  maxDate?: Date | null;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  baseIds: string[];
  selectedOriginId: string;
  selectedDestinationId: string;
  onOriginIdChange: (baseId: string) => void;
  onDestinationIdChange: (baseId: string) => void;
}

const FilterSection = ({
  minDate,
  maxDate,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  baseIds,
  selectedOriginId,
  selectedDestinationId,
  onOriginIdChange,
  onDestinationIdChange,
}: FilterSectionProps) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div
        style={{
          marginTop: '32px',
          marginBottom: '24px',
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ minWidth: '250px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#000',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Start Date
          </label>
          <DatePicker
            value={startDate}
            onChange={(newValue) => onStartDateChange(newValue)}
            minDate={minDate || undefined}
            maxDate={endDate || maxDate || undefined}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                placeholder: 'Select date',
                sx: {
                  backgroundColor: '#fff',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#d0d0d0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#a0a0a0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                },
              },
            }}
          />
        </div>

        <div style={{ minWidth: '250px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#000',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            End Date
          </label>
          <DatePicker
            value={endDate}
            onChange={(newValue) => onEndDateChange(newValue)}
            minDate={startDate || minDate || undefined}
            maxDate={maxDate || undefined}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
                placeholder: 'Select date',
                sx: {
                  backgroundColor: '#fff',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#d0d0d0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#a0a0a0',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#1976d2',
                    },
                  },
                },
              },
            }}
          />
        </div>

        <div style={{ minWidth: '250px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#000',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Origin
          </label>
          <FormControl size="small" fullWidth>
            <Select
              value={selectedOriginId}
              onChange={(e) => onOriginIdChange(e.target.value)}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <span style={{ color: '#999' }}>Select origin</span>;
                }
                return selected;
              }}
              sx={{
                backgroundColor: '#fff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d0d0d0',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#a0a0a0',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1976d2',
                },
              }}
            >
              <MenuItem value="">All Origins</MenuItem>
              {baseIds.map((baseId) => (
                <MenuItem key={baseId} value={baseId}>
                  {baseId}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div style={{ minWidth: '250px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#000',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Destination
          </label>
          <FormControl size="small" fullWidth>
            <Select
              value={selectedDestinationId}
              onChange={(e) => onDestinationIdChange(e.target.value)}
              displayEmpty
              renderValue={(selected) => {
                if (!selected) {
                  return <span style={{ color: '#999' }}>Select destination</span>;
                }
                return selected;
              }}
              sx={{
                backgroundColor: '#fff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#d0d0d0',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#a0a0a0',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#1976d2',
                },
              }}
            >
              <MenuItem value="">All Destinations</MenuItem>
              {baseIds.map((baseId) => (
                <MenuItem key={baseId} value={baseId}>
                  {baseId}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>
    </LocalizationProvider>
  );
};

const AircraftOperationsPageContent = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [earliestStartDate, setEarliestStartDate] = useState<Date | null>(null);
  const [latestEndDate, setLatestEndDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [baseIds, setBaseIds] = useState<string[]>([]);
  const [selectedOriginId, setSelectedOriginId] = useState<string>('');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [inProgressCount, setInProgressCount] = useState<number>(0);
  const [plannedCount, setPlannedCount] = useState<number>(0);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const earliestStartDateStr = await getEarliestOperationDate();
        setEarliestStartDate(earliestStartDateStr ? new Date(earliestStartDateStr) : null);

        const latestEndDateStr = await getLatestEndDate();
        setLatestEndDate(latestEndDateStr ? new Date(latestEndDateStr) : null);

        const uniqueIds = await getUniqueBaseIds();
        setBaseIds(uniqueIds);
      } catch (error) {
        console.error('An error occurred: ', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, []);

  // Separate useEffect to update KPI counts when filters change
  useEffect(() => {
    const loadOperationCounts = async () => {
      try {
        // Build filter based on selected filters
        let baseFilter = '';

        if (startDate) {
          const startDateStr = startDate.toISOString().split('T')[0];
          baseFilter = `startDate >= '${startDateStr}'`;
        }

        if (endDate) {
          const endDateStr = endDate.toISOString().split('T')[0];
          baseFilter = baseFilter ? `${baseFilter} && endDate <= '${endDateStr}'` : `endDate <= '${endDateStr}'`;
        }

        if (selectedOriginId) {
          baseFilter = baseFilter
            ? `${baseFilter} && origin == '${selectedOriginId}'`
            : `origin == '${selectedOriginId}'`;
        }

        if (selectedDestinationId) {
          baseFilter = baseFilter
            ? `${baseFilter} && destination == '${selectedDestinationId}'`
            : `destination == '${selectedDestinationId}'`;
        }

        // Fetch all three counts in parallel for efficiency
        const completedFilter = baseFilter ? `${baseFilter} && status == 'Completed'` : "status == 'Completed'";

        const inProgressFilter = baseFilter ? `${baseFilter} && status == 'In Progress'` : "status == 'In Progress'";

        const plannedFilter = baseFilter ? `${baseFilter} && status == 'Planned'` : "status == 'Planned'";

        const [completed, inProgress, planned] = await Promise.all([
          fetchCountWithFilter(completedFilter),
          fetchCountWithFilter(inProgressFilter),
          fetchCountWithFilter(plannedFilter),
        ]);

        setCompletedCount(completed);
        setInProgressCount(inProgress);
        setPlannedCount(planned);
      } catch (error) {
        console.error('Error loading operation counts: ', error);
      }
    };

    // Only load counts after initial page data is loaded
    if (!loading) {
      loadOperationCounts();
    }
  }, [startDate, endDate, selectedOriginId, selectedDestinationId, loading]);

  if (error) {
    return (
      <PageContainer currentPath="/operations">
        <ErrorModal errorMessage={error} />
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer currentPath="/operations">
        <LoadingAnimation />
      </PageContainer>
    );
  }

  return (
    <PageContainer currentPath="/operations">
      <div
        style={{
          padding: '24px',
          minHeight: '100vh',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <ContentSection>
          <ContentHeader title="Operations" />
          <ContentDescription description="This page provides an overview of the forecasted Operations by aircraft, start date, end date, etc." />
          <FilterSection
            minDate={earliestStartDate}
            maxDate={latestEndDate}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            baseIds={baseIds}
            selectedOriginId={selectedOriginId}
            selectedDestinationId={selectedDestinationId}
            onOriginIdChange={setSelectedOriginId}
            onDestinationIdChange={setSelectedDestinationId}
          />

          <KPIStatsContainer>
            <KPIStatsTile title="Completed Operations" value={completedCount} showVerticalBarToRight={true} />
            <KPIStatsTile title="In Progress Operations" value={inProgressCount} showVerticalBarToRight={true} />
            <KPIStatsTile title="Planned Operations" value={plannedCount} showVerticalBarToRight={false} />
          </KPIStatsContainer>
        </ContentSection>

        <ContentSection title="Operations Data" noPadding>
          <div style={{ padding: '0 24px 0 24px' }}>
            <OperationsPaginatedTable
              startDate={startDate}
              endDate={endDate}
              originId={selectedOriginId}
              destinationId={selectedDestinationId}
            />
          </div>
        </ContentSection>
      </div>
    </PageContainer>
  );
};

const AircraftOperationsPage = () => {
  return (
    <ThemeProvider>
      <AircraftOperationsPageContent />
    </ThemeProvider>
  );
};

export default AircraftOperationsPage;
