import React, { useEffect, useState } from 'react';

import { fetchOperationsWithPagination } from '@c3/app/ui/src/components/CRUDMethods/OperationCRUD';
import LoadingAnimation from '@c3/app/ui/src/components/misc/LoadingAnimation';
import ErrorModal from '@c3/app/ui/src/components/misc/ErrorModal';
import PageButton from '@c3/app/ui/src/components/table/PageButton';
import { Operation } from '@c3/types';

interface OperationsPaginatedTableProps {
  filter?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  originId?: string;
  destinationId?: string;
}

const OperationsPaginatedTable = ({
  filter = '',
  startDate,
  endDate,
  originId,
  destinationId,
}: OperationsPaginatedTableProps) => {
  const [page, setPage] = useState<number>(0);
  const [operationData, setOperationData] = useState<Operation[]>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 10;

  const tableHeaders = ['Operation ID', 'Aircraft ID', 'Status', 'Origin', 'Destination', 'Start Date', 'End Date'];

  useEffect(() => {
    const loadPaginatedOperations = async () => {
      setLoading(true);

      try {
        // Build filter based on date range
        let dateFilter = filter;

        if (startDate) {
          const startDateStr = startDate.toISOString().split('T')[0];
          dateFilter = dateFilter
            ? `${dateFilter} && startDate >= '${startDateStr}'`
            : `startDate >= '${startDateStr}'`;
        }

        if (endDate) {
          const endDateStr = endDate.toISOString().split('T')[0];
          dateFilter = dateFilter ? `${dateFilter} && endDate <= '${endDateStr}'` : `endDate <= '${endDateStr}'`;
        }

        if (originId) {
          dateFilter = dateFilter ? `${dateFilter} && origin == '${originId}'` : `origin == '${originId}'`;
        }

        if (destinationId) {
          dateFilter = dateFilter
            ? `${dateFilter} && destination == '${destinationId}'`
            : `destination == '${destinationId}'`;
        }

        const data = await fetchOperationsWithPagination(dateFilter, PAGE_SIZE, page * PAGE_SIZE);
        setOperationData(data);
      } catch (error) {
        console.error('Error occurred fetching paginated data: ', error.message);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadPaginatedOperations();
  }, [page, filter, startDate, endDate, originId, destinationId]);

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return <ErrorModal errorMessage={error} />;
  }

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e5e5' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'Inter, Helvetica Neue, Arial, Helvetica, sans-serif',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#fafafa' }}>
            {tableHeaders.map((header) => {
              return (
                <th
                  key={header}
                  style={{
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: '#555',
                    borderBottom: '1px solid #e5e5e5',
                  }}
                >
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {operationData && operationData.length > 0 ? (
            operationData.map((op) => {
              const aircraftId =
                typeof op.aircraft === 'object' && op.aircraft?.id ? op.aircraft.id : op.aircraft || 'N/A';
              const originId = typeof op.origin === 'object' && op.origin?.id ? op.origin.id : op.origin || 'N/A';
              const destinationId =
                typeof op.destination === 'object' && op.destination?.id ? op.destination.id : op.destination || 'N/A';
              return (
                <tr key={op.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>{op.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>{aircraftId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>{op.status || 'N/A'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>{originId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>{destinationId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>
                    {op.startDate ? new Date(op.startDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#333' }}>
                    {op.endDate ? new Date(op.endDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} style={{ padding: '24px', textAlign: 'center', fontSize: '14px', color: '#999' }}>
                No operations found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px',
          borderTop: '1px solid #e5e5e5',
          backgroundColor: '#fafafa',
        }}
      >
        <div style={{ fontSize: '13px', color: '#666' }}>Rows per page: {PAGE_SIZE}</div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <PageButton updateCurrentPage={() => setPage((prev) => prev - 1)} disabled={page === 0} icon="‹" />
          <span style={{ fontSize: '13px', color: '#666' }}>{page + 1}</span>
          <PageButton
            updateCurrentPage={() => setPage((prev) => prev + 1)}
            disabled={!operationData || operationData.length < PAGE_SIZE}
            icon="›"
          />
        </div>
      </div>
    </div>
  );
};

export default OperationsPaginatedTable;
