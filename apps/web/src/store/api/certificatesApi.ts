import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';

export interface CertificateItem {
  id: string;
  learnerId: string;
  learnerName: string;
  trackName: string;
  verifiedAt: string;
  status: 'pending' | 'verified' | 'rejected';
  downloadUrl?: string;
}

const certificatesAdapter = createEntityAdapter<CertificateItem, string>({
  selectId: (cert: CertificateItem) => cert.id,
  sortComparer: (a, b) => new Date(b.verifiedAt || 0).getTime() - new Date(a.verifiedAt || 0).getTime(),
});

export const certificatesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyCertificates: builder.query<EntityState<CertificateItem, string>, void>({
      query: () => '/certificates/my',
      transformResponse: (response: CertificateItem[]) =>
        certificatesAdapter.setAll(certificatesAdapter.getInitialState(), response),
      providesTags: (result) =>
        result
          ? [
              ...result.ids.map((id) => ({ type: 'Certificate' as const, id })),
              { type: 'Certificate', id: 'LIST' },
            ]
          : [{ type: 'Certificate', id: 'LIST' }],
    }),
    getPendingCertificates: builder.query<EntityState<CertificateItem, string>, void>({
      query: () => '/certificates/pending',
      transformResponse: (response: CertificateItem[]) =>
        certificatesAdapter.setAll(certificatesAdapter.getInitialState(), response),
      providesTags: ['Certificate'],
    }),
    verifyCertificate: builder.mutation<CertificateItem, { id: string; approve: boolean }>({
      query: ({ id, approve }) => ({
        url: `/certificates/${id}/verify`,
        method: 'POST',
        body: { approve },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Certificate', id }],
    }),
  }),
});

export const {
  useGetMyCertificatesQuery,
  useGetPendingCertificatesQuery,
  useVerifyCertificateMutation,
} = certificatesApi;
export const { selectAll: selectAllCertificates, selectById: selectCertificateById } =
  certificatesAdapter.getSelectors();
