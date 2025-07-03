// Notes Master Constants

export const NOTE_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
}

export const VIEW_MODES = {
  EDIT: 'edit',
  PREVIEW: 'preview',
  SPLIT: 'split'
}

export const SORT_OPTIONS = {
  CREATED_DESC: 'created_desc',
  CREATED_ASC: 'created_asc',
  UPDATED_DESC: 'updated_desc',
  UPDATED_ASC: 'updated_asc',
  TITLE_ASC: 'title_asc',
  TITLE_DESC: 'title_desc'
}

export const DEFAULT_NOTE = {
  id: '',
  title: 'Untitled Note',
  content: '',
  tags: [],
  status: NOTE_STATUS.ACTIVE,
  createdAt: null,
  updatedAt: null,
  starred: false,
  wordCount: 0
}

export const BACKLINK_REGEX = /\[\[([^\]]+)\]\]/g

export const SEARCH_FILTERS = {
  ALL: 'all',
  TITLE: 'title',
  CONTENT: 'content',
  TAGS: 'tags'
}

export const GRAPH_CONFIG = {
  NODE_RADIUS: 8,
  LINK_DISTANCE: 100,
  CHARGE_STRENGTH: -300,
  MAX_NODES: 100
}

export const AUTOSAVE_DELAY = 1000 // milliseconds

export const DEFAULT_SETTINGS = {
  theme: 'light',
  defaultViewMode: VIEW_MODES.SPLIT,
  enableAutosave: true,
  showWordCount: true,
  enableBacklinks: true,
  enableGraphView: true,
  defaultSortOrder: SORT_OPTIONS.UPDATED_DESC
}

export const KEYBOARD_SHORTCUTS = {
  NEW_NOTE: 'Ctrl+N',
  SAVE_NOTE: 'Ctrl+S',
  SEARCH: 'Ctrl+K',
  TOGGLE_VIEW: 'Ctrl+M',
  DELETE_NOTE: 'Delete'
} 