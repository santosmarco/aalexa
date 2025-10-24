export type TinderConfig = {
  readonly apiBaseUrl?: string;
  readonly timeout?: number;
  readonly userAgent?: string;
};

export type AuthToken = {
  readonly token: string;
  readonly refreshToken?: string;
};

export type Coordinates = {
  readonly lat: number;
  readonly lon: number;
};

export type Photo = {
  readonly id: string;
  readonly url: string;
  readonly processedFiles?: ReadonlyArray<{
    readonly url: string;
    readonly width: number;
    readonly height: number;
  }>;
};

export type Job = {
  readonly title?: string;
  readonly company?: {
    readonly name: string;
  };
};

export type School = {
  readonly name: string;
  readonly id?: string;
};

export type User = {
  readonly _id: string;
  readonly name: string;
  readonly bio?: string;
  readonly birth_date: string;
  readonly photos: ReadonlyArray<Photo>;
  readonly gender: 0 | 1;
  readonly jobs?: ReadonlyArray<Job>;
  readonly schools?: ReadonlyArray<School>;
  readonly distance_mi?: number;
  readonly s_number?: number;
  readonly ping_time?: string;
};

export type Recommendation = {
  readonly type: 'user';
  readonly user: User;
  readonly distance_mi?: number;
  readonly content_hash: string;
  readonly s_number: number;
  readonly teaser?: {
    readonly string: string;
  };
};

export type Match = {
  readonly _id: string;
  readonly closed: boolean;
  readonly common_friend_count: number;
  readonly common_like_count: number;
  readonly created_date: string;
  readonly dead: boolean;
  readonly last_activity_date: string;
  readonly message_count: number;
  readonly messages: ReadonlyArray<Message>;
  readonly participants: ReadonlyArray<string>;
  readonly pending: boolean;
  readonly is_super_like: boolean;
  readonly is_boost_match: boolean;
  readonly is_super_boost_match: boolean;
  readonly person: User;
};

export type Message = {
  readonly _id: string;
  readonly match_id: string;
  readonly to: string;
  readonly from: string;
  readonly message: string;
  readonly sent_date: string;
  readonly created_date: string;
  readonly timestamp: number;
};

export type ProfileUpdate = {
  readonly name?: string;
  readonly bio?: string;
  readonly birth_date?: string;
  readonly gender?: 0 | 1;
  readonly interested_in_gender?: ReadonlyArray<0 | 1>;
  readonly age_filter_min?: number;
  readonly age_filter_max?: number;
  readonly distance_filter?: number;
};

export type RecommendationsResponse = {
  readonly results: ReadonlyArray<Recommendation>;
  readonly timeout: number;
};

export type MatchResponse = {
  readonly match: boolean;
  readonly likes_remaining?: number;
};

export type LikeResponse = MatchResponse;

export type PassResponse = {
  readonly status: number;
};

export type SuperLikeResponse = MatchResponse & {
  readonly super_likes: {
    readonly remaining: number;
  };
};

export type MatchesResponse = {
  readonly matches: ReadonlyArray<Match>;
};

export type SendMessageResponse = {
  readonly _id: string;
  readonly from: string;
  readonly to: string;
  readonly message: string;
  readonly sent_date: string;
  readonly created_date: string;
  readonly timestamp: number;
};

export type Profile = {
  readonly _id: string;
  readonly bio: string;
  readonly birth_date: string;
  readonly create_date: string;
  readonly name: string;
  readonly photos: ReadonlyArray<Photo>;
  readonly gender: 0 | 1;
  readonly interested_in: ReadonlyArray<0 | 1>;
  readonly age_filter_min: number;
  readonly age_filter_max: number;
  readonly distance_filter: number;
  readonly jobs?: ReadonlyArray<Job>;
  readonly schools?: ReadonlyArray<School>;
  readonly pos: Coordinates;
};
