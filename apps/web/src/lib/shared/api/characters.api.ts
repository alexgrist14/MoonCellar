import {
  IFindCharacterPortraitsRequest,
  IFindCharacterPortraitsResponse,
  ICharacterAiDraftRequest,
  ICharacterAiDraftRun,
  ICharacterResponse,
  IGetAdminCharacters,
  IGetAdminCharactersResponse,
  IGetCharactersRequest,
  ISaveCharacterRequest,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const CHARACTERS_URL = `${API_URL}/characters`;

export const charactersApi = {
  findPortraits: (dto: IFindCharacterPortraitsRequest) =>
    agent.post<IFindCharacterPortraitsResponse>(
      `${CHARACTERS_URL}/portraits`,
      dto
    ),
  getAiDrafts: () =>
    agent.get<ICharacterAiDraftRun[]>(`${CHARACTERS_URL}/ai-drafts`),
  startAiDraft: (dto: ICharacterAiDraftRequest) =>
    agent.post<ICharacterAiDraftRun>(`${CHARACTERS_URL}/ai-drafts`, dto),
  retryAiDraft: (id: string) =>
    agent.post<ICharacterAiDraftRun>(`${CHARACTERS_URL}/ai-drafts/${id}/retry`),
  deleteAiDraft: (id: string) =>
    agent.delete(`${CHARACTERS_URL}/ai-drafts/${id}`),
  search: (params: IGetCharactersRequest) =>
    agent.get<ICharacterResponse[]>(CHARACTERS_URL, { params }),
  getAdminList: (params: IGetAdminCharacters) =>
    agent.get<IGetAdminCharactersResponse>(`${CHARACTERS_URL}/admin`, {
      params,
    }),
  create: (body: ISaveCharacterRequest) =>
    agent.post<ICharacterResponse>(CHARACTERS_URL, body),
  update: (id: string, body: ISaveCharacterRequest) =>
    agent.patch<ICharacterResponse>(`${CHARACTERS_URL}/${id}`, body),
  remove: (id: string) => agent.delete(`${CHARACTERS_URL}/${id}`),
  uploadImage: (id: string, file: File) => {
    const formData = new FormData();

    formData.append("file", file);

    return agent.post<{ mugShot: string }>(
      `${CHARACTERS_URL}/${id}/image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },
};
