import type { GraphQLResolveInfo } from "graphql";
import type { GraphQLContext } from "./context";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

/** Authentication response payload */
export type AuthPayload = {
  __typename?: "AuthPayload";
  error?: Maybe<Scalars["String"]["output"]>;
  success: Scalars["Boolean"]["output"];
  user?: Maybe<User>;
};

/** Input for creating a category */
export type CategoryInput = {
  color?: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
};

/** Input for updating a category */
export type CategoryUpdateInput = {
  color?: InputMaybe<Scalars["String"]["input"]>;
  name?: InputMaybe<Scalars["String"]["input"]>;
};

/** Input for creating a wishlist item */
export type ItemInput = {
  categoryId?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  favicon?: InputMaybe<Scalars["String"]["input"]>;
  linkDescription?: InputMaybe<Scalars["String"]["input"]>;
  title: Scalars["String"]["input"];
  url?: InputMaybe<Scalars["String"]["input"]>;
};

/** Input for creating an item link */
export type ItemLinkInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  isPrimary?: InputMaybe<Scalars["Boolean"]["input"]>;
  url: Scalars["String"]["input"];
};

/** Input for updating an item link */
export type ItemLinkUpdateInput = {
  description?: InputMaybe<Scalars["String"]["input"]>;
  isPrimary?: InputMaybe<Scalars["Boolean"]["input"]>;
  url?: InputMaybe<Scalars["String"]["input"]>;
};

/** Input for updating a wishlist item */
export type ItemUpdateInput = {
  categoryId?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  favicon?: InputMaybe<Scalars["String"]["input"]>;
  title?: InputMaybe<Scalars["String"]["input"]>;
};

/** Input for user login */
export type LoginInput = {
  email: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
};

export type Mutation = {
  __typename?: "Mutation";
  /** Add a link to a wishlist item */
  addItemLink: WishlistItemLink;
  /** Create a new category */
  createCategory: WishlistCategory;
  /** Create a new wishlist item */
  createItem: WishlistItem;
  /** Delete a category */
  deleteCategory: Scalars["Boolean"]["output"];
  /** Delete a wishlist item */
  deleteItem: Scalars["Boolean"]["output"];
  /** Delete an item link */
  deleteItemLink: Scalars["Boolean"]["output"];
  /** Login with email and password */
  login: AuthPayload;
  /** Logout the current user */
  logout: Scalars["Boolean"]["output"];
  /** Register a new user */
  register: AuthPayload;
  /** Set a link as the primary link for an item */
  setPrimaryLink: Scalars["Boolean"]["output"];
  /** Update a category */
  updateCategory?: Maybe<WishlistCategory>;
  /** Update a wishlist item */
  updateItem?: Maybe<WishlistItem>;
  /** Update an item link */
  updateItemLink?: Maybe<WishlistItemLink>;
};

export type MutationAddItemLinkArgs = {
  input: ItemLinkInput;
  itemId: Scalars["ID"]["input"];
};

export type MutationCreateCategoryArgs = {
  input: CategoryInput;
};

export type MutationCreateItemArgs = {
  input: ItemInput;
};

export type MutationDeleteCategoryArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteItemArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeleteItemLinkArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationLoginArgs = {
  input: LoginInput;
};

export type MutationRegisterArgs = {
  input: RegisterInput;
};

export type MutationSetPrimaryLinkArgs = {
  itemId: Scalars["ID"]["input"];
  linkId: Scalars["ID"]["input"];
};

export type MutationUpdateCategoryArgs = {
  id: Scalars["ID"]["input"];
  input: CategoryUpdateInput;
};

export type MutationUpdateItemArgs = {
  id: Scalars["ID"]["input"];
  input: ItemUpdateInput;
};

export type MutationUpdateItemLinkArgs = {
  id: Scalars["ID"]["input"];
  input: ItemLinkUpdateInput;
};

/** Pagination information */
export type PaginationInfo = {
  __typename?: "PaginationInfo";
  hasNext: Scalars["Boolean"]["output"];
  hasPrevious: Scalars["Boolean"]["output"];
  page: Scalars["Int"]["output"];
  pageSize: Scalars["Int"]["output"];
  totalItems: Scalars["Int"]["output"];
  totalPages: Scalars["Int"]["output"];
};

/** Input for pagination */
export type PaginationInput = {
  page?: InputMaybe<Scalars["Int"]["input"]>;
  pageSize?: InputMaybe<Scalars["Int"]["input"]>;
};

export type Query = {
  __typename?: "Query";
  /** Get all categories for the current user */
  categories: Array<WishlistCategory>;
  /** Get a specific wishlist item by ID */
  item?: Maybe<WishlistItem>;
  /** Get the current authenticated user */
  me?: Maybe<User>;
  /** Get wishlist data with optional filters and pagination */
  wishlist: WishlistPayload;
};

export type QueryItemArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryWishlistArgs = {
  filter?: InputMaybe<WishlistFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};

/** Input for user registration */
export type RegisterInput = {
  email: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
};

/** Sort direction enum */
export enum SortDirection {
  Asc = "ASC",
  Desc = "DESC",
}

/** A user in the system */
export type User = {
  __typename?: "User";
  createdAt: Scalars["String"]["output"];
  email: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  updatedAt: Scalars["String"]["output"];
};

/** A wishlist category */
export type WishlistCategory = {
  __typename?: "WishlistCategory";
  color?: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  updatedAt: Scalars["String"]["output"];
  userId: Scalars["Int"]["output"];
};

/** Input for filtering wishlist data */
export type WishlistFilterInput = {
  categoryId?: InputMaybe<Scalars["String"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
  /** Field to sort by. Defaults to CREATED_AT if not specified. */
  sortBy?: InputMaybe<WishlistSortKey>;
  /** Sort direction. Defaults to DESC if not specified. */
  sortDir?: InputMaybe<SortDirection>;
};

/** A wishlist item */
export type WishlistItem = {
  __typename?: "WishlistItem";
  categoryId?: Maybe<Scalars["String"]["output"]>;
  createdAt: Scalars["String"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  favicon?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  links: Array<WishlistItemLink>;
  title: Scalars["String"]["output"];
  updatedAt: Scalars["String"]["output"];
  userId: Scalars["Int"]["output"];
};

/** A link associated with a wishlist item */
export type WishlistItemLink = {
  __typename?: "WishlistItemLink";
  createdAt: Scalars["String"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  id: Scalars["ID"]["output"];
  isPrimary: Scalars["Boolean"]["output"];
  itemId: Scalars["String"]["output"];
  updatedAt: Scalars["String"]["output"];
  url: Scalars["String"]["output"];
};

/** Wishlist data payload with categories, items, and pagination */
export type WishlistPayload = {
  __typename?: "WishlistPayload";
  categories: Array<WishlistCategory>;
  items: Array<WishlistItem>;
  pagination: PaginationInfo;
};

/** Sort keys for wishlist items and categories */
export enum WishlistSortKey {
  CreatedAt = "CREATED_AT",
  Name = "NAME",
  Title = "TITLE",
  UpdatedAt = "UPDATED_AT",
}

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {},
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AuthPayload: ResolverTypeWrapper<AuthPayload>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  CategoryInput: CategoryInput;
  CategoryUpdateInput: CategoryUpdateInput;
  ID: ResolverTypeWrapper<Scalars["ID"]["output"]>;
  Int: ResolverTypeWrapper<Scalars["Int"]["output"]>;
  ItemInput: ItemInput;
  ItemLinkInput: ItemLinkInput;
  ItemLinkUpdateInput: ItemLinkUpdateInput;
  ItemUpdateInput: ItemUpdateInput;
  LoginInput: LoginInput;
  Mutation: ResolverTypeWrapper<{}>;
  PaginationInfo: ResolverTypeWrapper<PaginationInfo>;
  PaginationInput: PaginationInput;
  Query: ResolverTypeWrapper<{}>;
  RegisterInput: RegisterInput;
  SortDirection: SortDirection;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  User: ResolverTypeWrapper<User>;
  WishlistCategory: ResolverTypeWrapper<WishlistCategory>;
  WishlistFilterInput: WishlistFilterInput;
  WishlistItem: ResolverTypeWrapper<WishlistItem>;
  WishlistItemLink: ResolverTypeWrapper<WishlistItemLink>;
  WishlistPayload: ResolverTypeWrapper<WishlistPayload>;
  WishlistSortKey: WishlistSortKey;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AuthPayload: AuthPayload;
  Boolean: Scalars["Boolean"]["output"];
  CategoryInput: CategoryInput;
  CategoryUpdateInput: CategoryUpdateInput;
  ID: Scalars["ID"]["output"];
  Int: Scalars["Int"]["output"];
  ItemInput: ItemInput;
  ItemLinkInput: ItemLinkInput;
  ItemLinkUpdateInput: ItemLinkUpdateInput;
  ItemUpdateInput: ItemUpdateInput;
  LoginInput: LoginInput;
  Mutation: {};
  PaginationInfo: PaginationInfo;
  PaginationInput: PaginationInput;
  Query: {};
  RegisterInput: RegisterInput;
  String: Scalars["String"]["output"];
  User: User;
  WishlistCategory: WishlistCategory;
  WishlistFilterInput: WishlistFilterInput;
  WishlistItem: WishlistItem;
  WishlistItemLink: WishlistItemLink;
  WishlistPayload: WishlistPayload;
}>;

export type AuthPayloadResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["AuthPayload"] = ResolversParentTypes["AuthPayload"],
> = ResolversObject<{
  error?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes["User"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"],
> = ResolversObject<{
  addItemLink?: Resolver<
    ResolversTypes["WishlistItemLink"],
    ParentType,
    ContextType,
    RequireFields<MutationAddItemLinkArgs, "input" | "itemId">
  >;
  createCategory?: Resolver<
    ResolversTypes["WishlistCategory"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateCategoryArgs, "input">
  >;
  createItem?: Resolver<
    ResolversTypes["WishlistItem"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateItemArgs, "input">
  >;
  deleteCategory?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteCategoryArgs, "id">
  >;
  deleteItem?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteItemArgs, "id">
  >;
  deleteItemLink?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteItemLinkArgs, "id">
  >;
  login?: Resolver<
    ResolversTypes["AuthPayload"],
    ParentType,
    ContextType,
    RequireFields<MutationLoginArgs, "input">
  >;
  logout?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  register?: Resolver<
    ResolversTypes["AuthPayload"],
    ParentType,
    ContextType,
    RequireFields<MutationRegisterArgs, "input">
  >;
  setPrimaryLink?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType,
    RequireFields<MutationSetPrimaryLinkArgs, "itemId" | "linkId">
  >;
  updateCategory?: Resolver<
    Maybe<ResolversTypes["WishlistCategory"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateCategoryArgs, "id" | "input">
  >;
  updateItem?: Resolver<
    Maybe<ResolversTypes["WishlistItem"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateItemArgs, "id" | "input">
  >;
  updateItemLink?: Resolver<
    Maybe<ResolversTypes["WishlistItemLink"]>,
    ParentType,
    ContextType,
    RequireFields<MutationUpdateItemLinkArgs, "id" | "input">
  >;
}>;

export type PaginationInfoResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["PaginationInfo"] = ResolversParentTypes["PaginationInfo"],
> = ResolversObject<{
  hasNext?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  hasPrevious?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  page?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  pageSize?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  totalItems?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  totalPages?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["Query"] = ResolversParentTypes["Query"],
> = ResolversObject<{
  categories?: Resolver<
    Array<ResolversTypes["WishlistCategory"]>,
    ParentType,
    ContextType
  >;
  item?: Resolver<
    Maybe<ResolversTypes["WishlistItem"]>,
    ParentType,
    ContextType,
    RequireFields<QueryItemArgs, "id">
  >;
  me?: Resolver<Maybe<ResolversTypes["User"]>, ParentType, ContextType>;
  wishlist?: Resolver<
    ResolversTypes["WishlistPayload"],
    ParentType,
    ContextType,
    Partial<QueryWishlistArgs>
  >;
}>;

export type UserResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["User"] = ResolversParentTypes["User"],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WishlistCategoryResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["WishlistCategory"] = ResolversParentTypes["WishlistCategory"],
> = ResolversObject<{
  color?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WishlistItemResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["WishlistItem"] = ResolversParentTypes["WishlistItem"],
> = ResolversObject<{
  categoryId?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  description?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  favicon?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  links?: Resolver<
    Array<ResolversTypes["WishlistItemLink"]>,
    ParentType,
    ContextType
  >;
  title?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WishlistItemLinkResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["WishlistItemLink"] = ResolversParentTypes["WishlistItemLink"],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  description?: Resolver<
    Maybe<ResolversTypes["String"]>,
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  isPrimary?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  itemId?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  url?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type WishlistPayloadResolvers<
  ContextType = GraphQLContext,
  ParentType extends
    ResolversParentTypes["WishlistPayload"] = ResolversParentTypes["WishlistPayload"],
> = ResolversObject<{
  categories?: Resolver<
    Array<ResolversTypes["WishlistCategory"]>,
    ParentType,
    ContextType
  >;
  items?: Resolver<
    Array<ResolversTypes["WishlistItem"]>,
    ParentType,
    ContextType
  >;
  pagination?: Resolver<
    ResolversTypes["PaginationInfo"],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = GraphQLContext> = ResolversObject<{
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PaginationInfo?: PaginationInfoResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  WishlistCategory?: WishlistCategoryResolvers<ContextType>;
  WishlistItem?: WishlistItemResolvers<ContextType>;
  WishlistItemLink?: WishlistItemLinkResolvers<ContextType>;
  WishlistPayload?: WishlistPayloadResolvers<ContextType>;
}>;
