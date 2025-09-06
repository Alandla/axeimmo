// =============================================================================
// TYPES DE FILTRES POUR LES VIDÉOS
// =============================================================================

export enum VideoFilterType {
  DURATION = "duration",
  CREATED_BY = "created-by", 
  HAS_AVATAR = "has-avatar",
  IS_OUTDATED = "is-outdated",
  CREATED_DATE = "created-date",
}

export enum VideoDuration {
  LESS_THAN_30S = "less-than-30s",
  BETWEEN_30S_1MIN = "30s-1min",
  BETWEEN_1MIN_2MIN = "1min-2min", 
  BETWEEN_2MIN_5MIN = "2min-5min",
  MORE_THAN_5MIN = "more-than-5min",
}

export enum HasAvatar {
  YES = "yes",
  NO = "no",
}

export enum IsOutdated {
  YES = "yes", 
  NO = "no",
}

// =============================================================================
// TYPES DE FILTRES POUR LES ASSETS
// =============================================================================

export enum AssetFilterType {
  TYPE = "type",
  UPLOADED_BY = "uploaded-by",
  AI_GENERATED = "ai-generated",
  CREATED_DATE = "created-date",
}

export enum AssetType {
  IMAGE = "image",
  VIDEO = "video",
  ELEMENT = "element",
}

export enum AIGenerated {
  YES = "yes",
  NO = "no",
}

// =============================================================================
// TYPES PARTAGÉS
// =============================================================================

export enum DateRange {
  TODAY = "today",
  YESTERDAY = "yesterday",
  LAST_3_DAYS = "last-3-days",
  LAST_7_DAYS = "last-7-days",
  LAST_30_DAYS = "last-30-days",
  LAST_90_DAYS = "last-90-days",
} 