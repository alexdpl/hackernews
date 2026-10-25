--
-- PostgreSQL database dump
--

\restrict FH8UgYxFcloRfJfKPFU4SzT3qyDTjN7XbzxsjJGiegENOxmW7zCBh3MXEH4tL8j

-- Dumped from database version 18.6 (fd34222)
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: license_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.license_status AS ENUM (
    'active',
    'suspended',
    'revoked',
    'expired'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


--
-- Name: payment_provider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_provider AS ENUM (
    'stripe',
    'paypal'
);


--
-- Name: update_dkp_ads_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_dkp_ads_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone,
    alg text,
    crv text
);


--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb
);


--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: alert_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alert_logs (
    id integer NOT NULL,
    severity character varying(20) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    metadata jsonb,
    sent_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: alert_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alert_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alert_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alert_logs_id_seq OWNED BY public.alert_logs.id;


--
-- Name: api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_keys (
    id integer NOT NULL,
    user_id integer,
    name character varying(255) NOT NULL,
    key_hash text NOT NULL,
    key_prefix character varying(50) NOT NULL,
    key_masked character varying(100),
    role character varying(50) DEFAULT 'PRO'::character varying NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    usage_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    last_used_at timestamp without time zone
);


--
-- Name: api_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_keys_id_seq OWNED BY public.api_keys.id;


--
-- Name: api_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_logs (
    id integer NOT NULL,
    api_key_id integer,
    endpoint text NOT NULL,
    method character varying(10) NOT NULL,
    status_code integer NOT NULL,
    ip_address character varying(45),
    latency_ms integer,
    error_message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: api_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.api_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: api_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.api_logs_id_seq OWNED BY public.api_logs.id;


--
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    description text,
    icon character varying(50) DEFAULT 'i-heroicons-folder'::character varying,
    color character varying(30) DEFAULT '#10B981'::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb
);


--
-- Name: blog_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blog_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blog_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blog_categories_id_seq OWNED BY public.blog_categories.id;


--
-- Name: blog_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_comments (
    id integer NOT NULL,
    blog_slug character varying(255) NOT NULL,
    author character varying(255) NOT NULL,
    content text NOT NULL,
    points integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: blog_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blog_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blog_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blog_comments_id_seq OWNED BY public.blog_comments.id;


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_posts (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    content text NOT NULL,
    excerpt text,
    category_id integer,
    subcategory_id integer,
    author_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending_vault'::character varying NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    vault_certificate_id character varying(100),
    vault_hash character varying(64),
    views integer DEFAULT 0 NOT NULL,
    likes integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb
);


--
-- Name: blog_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blog_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blog_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blog_posts_id_seq OWNED BY public.blog_posts.id;


--
-- Name: blog_subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blog_subcategories (
    id integer NOT NULL,
    category_id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    description text
);


--
-- Name: blog_subcategories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blog_subcategories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blog_subcategories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blog_subcategories_id_seq OWNED BY public.blog_subcategories.id;


--
-- Name: bounties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bounties (
    id integer NOT NULL,
    github_issue_id character varying(100),
    repo_name character varying(255) NOT NULL,
    title text NOT NULL,
    url text NOT NULL,
    reward_pulse integer DEFAULT 100 NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    claimed_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: bounties_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bounties_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bounties_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bounties_id_seq OWNED BY public.bounties.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL,
    content text NOT NULL
);


--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: dkp_ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dkp_ads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    advertiser_email character varying(255) NOT NULL,
    title character varying(120) NOT NULL,
    snippet character varying(255),
    target_url text NOT NULL,
    category_tag character varying(50) DEFAULT 'SPONSORIZZATO DKP'::character varying,
    budget_credits integer DEFAULT 100 NOT NULL,
    status character varying(20) DEFAULT 'ACTIVE'::character varying NOT NULL,
    impressions_count integer DEFAULT 0,
    clicks_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: dkp_crawler_licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dkp_crawler_licenses (
    id integer NOT NULL,
    user_id integer NOT NULL,
    license_key character varying(255) NOT NULL,
    tier character varying(50) DEFAULT 'basic'::character varying,
    requests_limit integer DEFAULT 1000,
    requests_used integer DEFAULT 0,
    is_active boolean DEFAULT true,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: dkp_crawler_licenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.dkp_crawler_licenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dkp_crawler_licenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.dkp_crawler_licenses_id_seq OWNED BY public.dkp_crawler_licenses.id;


--
-- Name: ip_blacklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ip_blacklist (
    id integer NOT NULL,
    ip text NOT NULL,
    reason text NOT NULL,
    severity text NOT NULL,
    banned_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ip_blacklist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ip_blacklist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ip_blacklist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ip_blacklist_id_seq OWNED BY public.ip_blacklist.id;


--
-- Name: ip_whitelist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ip_whitelist (
    id integer NOT NULL,
    ip character varying(45) NOT NULL,
    description text NOT NULL,
    added_by character varying(100) DEFAULT 'Admin'::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: ip_whitelist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ip_whitelist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ip_whitelist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ip_whitelist_id_seq OWNED BY public.ip_whitelist.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    title text NOT NULL,
    company character varying(100) NOT NULL,
    location character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    type character varying(50) DEFAULT 'Remote'::character varying NOT NULL,
    apply_url text NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licenses (
    id text DEFAULT gen_random_uuid() NOT NULL,
    order_id text NOT NULL,
    license_key character varying(255) NOT NULL,
    customer_email character varying(255) NOT NULL,
    product_id character varying(100) NOT NULL,
    status public.license_status DEFAULT 'active'::public.license_status NOT NULL,
    downloads_count integer DEFAULT 0 NOT NULL,
    max_downloads integer DEFAULT 10 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    user_id integer,
    product_name character varying(255) NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id text DEFAULT gen_random_uuid() NOT NULL,
    customer_email character varying(255) NOT NULL,
    product_id character varying(100) NOT NULL,
    product_name character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'EUR'::character varying NOT NULL,
    payment_provider public.payment_provider NOT NULL,
    payment_intent_id character varying(255) NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    title text NOT NULL,
    url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    type character varying(20) DEFAULT 'news'::character varying NOT NULL,
    points integer DEFAULT 1 NOT NULL,
    content text,
    user_id integer NOT NULL,
    comments_count integer DEFAULT 0 NOT NULL
);


--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: pulse_chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pulse_chat_messages (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer,
    message text NOT NULL
);


--
-- Name: pulse_chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pulse_chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pulse_chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pulse_chat_messages_id_seq OWNED BY public.pulse_chat_messages.id;


--
-- Name: pulse_mail_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pulse_mail_messages (
    id integer NOT NULL,
    sender character varying(255) NOT NULL,
    recipient character varying(255) NOT NULL,
    subject text NOT NULL,
    body_text text,
    body_html text,
    direction character varying(20) DEFAULT 'INBOUND'::character varying,
    status character varying(20) DEFAULT 'UNREAD'::character varying,
    is_starred boolean DEFAULT false,
    reply_to_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: pulse_mail_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pulse_mail_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pulse_mail_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pulse_mail_messages_id_seq OWNED BY public.pulse_mail_messages.id;


--
-- Name: pulse_stories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pulse_stories (
    id integer NOT NULL,
    title text NOT NULL,
    url text,
    domain character varying(255),
    type character varying(50) NOT NULL,
    author character varying(255),
    points integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    author_id integer,
    comments_count integer DEFAULT 0,
    xp_awarded integer DEFAULT 0
);


--
-- Name: pulse_stories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pulse_stories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pulse_stories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pulse_stories_id_seq OWNED BY public.pulse_stories.id;


--
-- Name: pulse_user_xp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pulse_user_xp (
    id integer NOT NULL,
    xp integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: pulse_user_xp_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pulse_user_xp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pulse_user_xp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pulse_user_xp_id_seq OWNED BY public.pulse_user_xp.id;


--
-- Name: user_xp_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_xp_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount integer NOT NULL,
    action_type character varying(50) NOT NULL,
    description text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_xp_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_xp_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_xp_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_xp_transactions_id_seq OWNED BY public.user_xp_transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    username character varying(50) NOT NULL,
    bio text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    avatar_url text,
    reputation integer DEFAULT 100 NOT NULL,
    github_handle character varying(100),
    xp integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    badges jsonb DEFAULT '[]'::jsonb,
    pulse_balance integer DEFAULT 0 NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vault_certs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vault_certs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tool_type character varying(50) NOT NULL,
    title text NOT NULL,
    hash text NOT NULL,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: vault_certs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vault_certs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vault_certs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vault_certs_id_seq OWNED BY public.vault_certs.id;


--
-- Name: votes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.votes (
    id integer NOT NULL,
    post_id integer NOT NULL,
    username text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: votes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.votes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: votes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.votes_id_seq OWNED BY public.votes.id;


--
-- Name: xp_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.xp_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action text NOT NULL,
    points integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: xp_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.xp_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: xp_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.xp_transactions_id_seq OWNED BY public.xp_transactions.id;


--
-- Name: alert_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_logs ALTER COLUMN id SET DEFAULT nextval('public.alert_logs_id_seq'::regclass);


--
-- Name: api_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys ALTER COLUMN id SET DEFAULT nextval('public.api_keys_id_seq'::regclass);


--
-- Name: api_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_logs ALTER COLUMN id SET DEFAULT nextval('public.api_logs_id_seq'::regclass);


--
-- Name: blog_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories ALTER COLUMN id SET DEFAULT nextval('public.blog_categories_id_seq'::regclass);


--
-- Name: blog_comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_comments ALTER COLUMN id SET DEFAULT nextval('public.blog_comments_id_seq'::regclass);


--
-- Name: blog_posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts ALTER COLUMN id SET DEFAULT nextval('public.blog_posts_id_seq'::regclass);


--
-- Name: blog_subcategories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_subcategories ALTER COLUMN id SET DEFAULT nextval('public.blog_subcategories_id_seq'::regclass);


--
-- Name: bounties id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bounties ALTER COLUMN id SET DEFAULT nextval('public.bounties_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: dkp_crawler_licenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dkp_crawler_licenses ALTER COLUMN id SET DEFAULT nextval('public.dkp_crawler_licenses_id_seq'::regclass);


--
-- Name: ip_blacklist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ip_blacklist ALTER COLUMN id SET DEFAULT nextval('public.ip_blacklist_id_seq'::regclass);


--
-- Name: ip_whitelist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ip_whitelist ALTER COLUMN id SET DEFAULT nextval('public.ip_whitelist_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: pulse_chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pulse_chat_messages ALTER COLUMN id SET DEFAULT nextval('public.pulse_chat_messages_id_seq'::regclass);


--
-- Name: pulse_mail_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pulse_mail_messages ALTER COLUMN id SET DEFAULT nextval('public.pulse_mail_messages_id_seq'::regclass);


--
-- Name: pulse_stories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pulse_stories ALTER COLUMN id SET DEFAULT nextval('public.pulse_stories_id_seq'::regclass);


--
-- Name: pulse_user_xp id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pulse_user_xp ALTER COLUMN id SET DEFAULT nextval('public.pulse_user_xp_id_seq'::regclass);


--
-- Name: user_xp_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_xp_transactions ALTER COLUMN id SET DEFAULT nextval('public.user_xp_transactions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vault_certs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_certs ALTER COLUMN id SET DEFAULT nextval('public.vault_certs_id_seq'::regclass);


--
-- Name: votes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes ALTER COLUMN id SET DEFAULT nextval('public.votes_id_seq'::regclass);


--
-- Name: xp_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions ALTER COLUMN id SET DEFAULT nextval('public.xp_transactions_id_seq'::regclass);


--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt", alg, crv) FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config) FROM stdin;
ded03c2b-b5bc-4c79-8469-5efc31929537	neon-copper-tree	ep-raspy-mountain-au6hupch	2026-09-17 06:48:26.46+00	2026-09-17 06:48:26.46+00	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"magicLink": {"config": {"expiresIn": 5, "disableSignUp": false}, "enabled": false}, "phoneNumber": {"config": {"otp_expires_in": 300}, "enabled": false}, "organization": {"config": {"creatorRole": "owner", "membershipLimit": 100, "organizationLimit": 10, "sendInvitationEmail": false}, "enabled": true}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: alert_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.alert_logs (id, severity, title, message, metadata, sent_at) FROM stdin;
\.


--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_keys (id, user_id, name, key_hash, key_prefix, key_masked, role, status, usage_count, created_at, last_used_at) FROM stdin;
7	1	My App Production Key	f9f3260ec7185f4ee6c39603c33e0264:d995d98e6d967757c76cd676c19db7fce7446feec753a12fd2a88431879577e86920d79c199dfb526bda418fc7ec2139ca650677d02e4037947444521c72026f	dkp_live_c170256	dkp_live_c17...5e33	ENTERPRISE	REVOKED	0	2026-10-24 07:37:18.84	\N
6	1	alexdpl Admin Key Neural PG	df0deee6821b609481e058da07d67183:b4cf97567eed0fd5c82bc2433ac1d576a17bf18f6dd03795d31ed8c3d98be76b4c2d34f2b4ebfbaa8bbd6b50b91d2516a470689089601200ee6466b93844a689	dkp_live_f55815d	dkp_live_f55...9c15	PRO	REVOKED	0	2026-10-24 07:11:51.667	\N
1	1	Admin Master Key (God Mode)	0376ba0adbbe2e8dfeec8d613b9d762e1c8aae20c2cdc95eb4bb13849c654090	dkp_live_master_	dkp_live_master_...v25gold	ENTERPRISE	ACTIVE	2	2026-10-20 10:58:25.53423	2026-10-20 11:01:06.809
5	1	alexdpl Admin Key Production	f59373cd10578dad912c5cec57dbe458:9ec17df16bc37249be76a44a22626e09fa7afd3e02f31aea1568c48301a4ede913baaf7069ddb7307e78a35b401a2165c489ab3ed51a3072f6d4f132e83bb3e5	dkp_live_21c9963	dkp_live_21c...bdda	PRO	ACTIVE	1	2026-10-20 12:08:57.977	\N
8	1	My App Production Key	f5c73453195975f5e4f289dcc859335c:8c7f93c8f7d33936b68dbbe25038c67fdc18e407c71f86ae5e945d30698cbeeb154325e3cbce630549755aa584bd1896bdbcc1ed295d406c4a1283e2021271b6	dkp_live_593bcf1	dkp_live_593...2084	ENTERPRISE	ACTIVE	1	2026-10-24 08:44:42.449	\N
\.


--
-- Data for Name: api_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.api_logs (id, api_key_id, endpoint, method, status_code, ip_address, latency_ms, error_message, created_at) FROM stdin;
1	1	/api/v1/data	GET	200	::1	938	\N	2026-10-20 11:01:07.246104
\.


--
-- Data for Name: blog_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_categories (id, name, slug, description, icon, color, created_at, tags) FROM stdin;
3	AI, LLM & Machine Learning	ai-llm-machine-learning	Intelligenza Artificiale, RAG, e modelli locali.	🤖	#00dc82	2026-10-07 18:49:15.889266	["ai", "llm", "machine learning", "deep learning", "neural networks", "gpt-4", "openai", "llama-3", "anthropic", "claude", "huggingface", "pytorch", "tensorflow", "rag", "vector database", "prompt engineering", "langchain", "llamaindex", "autonomous agents", "nlp", "computer vision", "mlops", "reinforcement learning", "generative ai", "midjourney", "stable diffusion", "fine-tuning", "qlora", "peft", "edge ai", "ai ethics", "data science", "pandas", "numpy", "scikit-learn", "jupyter", "transformers", "whisper", "chatgpt", "copilot", "tabnine", "ai coding", "embeddings", "similarity search", "semantic search", "ai security", "prompt injection", "ai agents", "agi", "open source ai"]
5	Cloud Native & DevOps	cloud-native-devops	Infrastruttura, Kubernetes, Docker e CI/CD.	☁️	#38bdf8	2026-10-07 18:49:18.372865	["cloud", "devops", "cloud native", "kubernetes", "k8s", "docker", "containers", "microservices", "aws", "gcp", "azure", "google cloud", "amazon web services", "ci/cd", "github actions", "gitlab ci", "jenkins", "circleci", "terraform", "ansible", "infrastructure as code", "iac", "serverless", "lambda", "cloudflare", "vercel", "netlify", "service mesh", "istio", "linkerd", "observability", "monitoring", "prometheus", "grafana", "datadog", "new relic", "splunk", "elk stack", "logstash", "kibana", "sre", "site reliability engineering", "finops", "edge computing", "gitops", "argocd", "flux", "helm", "docker compose", "nginx", "traefik", "haproxy", "linux", "bash", "shell scripting", "system administration", "load balancing", "auto-scaling"]
4	Blockchain & Web3	blockchain-web3	DeFi, Smart Contracts e architetture decentralizzate.	⛓️	#8b5cf6	2026-10-07 18:49:17.258314	["blockchain", "web3", "crypto", "cryptocurrency", "bitcoin", "ethereum", "solana", "polkadot", "smart contracts", "solidity", "rust", "vyper", "defi", "decentralized finance", "zkp", "zero knowledge proofs", "rollups", "layer 2", "l2", "nft", "tokens", "erc20", "erc721", "consensus algorithms", "pow", "pos", "web3 wallets", "metamask", "walletconnect", "dao", "decentralized autonomous organization", "ipfs", "arweave", "decentralized storage", "web3.js", "ethers.js", "viem", "wagmi", "hardhat", "foundry", "truffle", "ganache", "blockchain security", "smart contract auditing", "reentrancy", "oracles", "chainlink", "the graph", "tokenomics", "enterprise blockchain", "hyperledger", "corda", "cbdc"]
13	Frontend Architecture	frontend-architecture	Sviluppo interfacce, framework e performance.	🎨	#ec4899	2026-10-08 14:54:34.927722	["frontend", "ui", "ux", "javascript", "typescript", "web development", "html", "css", "sass", "tailwindcss", "bootstrap", "vuejs", "vue3", "nuxtjs", "nuxt3", "react", "reactjs", "nextjs", "svelte", "sveltekit", "angular", "solidjs", "alpinejs", "htmx", "web assembly", "wasm", "micro-frontends", "pwa", "progressive web apps", "webgl", "three.js", "canvas", "svg", "accessibility", "a11y", "aria", "state management", "pinia", "redux", "zustand", "vuex", "build tools", "vite", "webpack", "rollup", "esbuild", "testing", "jest", "vitest", "cypress", "playwright", "testing library", "performance", "core web vitals", "seo", "server side rendering", "ssr", "ssg", "static site generation", "jamstack", "responsive design", "css grid", "flexbox", "animations", "framer motion", "gsap"]
14	Backend & Microservices	backend-microservices	Architetture lato server, API e scalabilità.	⚙️	#f59e0b	2026-10-11 07:54:21.894895	["backend", "server", "microservices", "api", "rest", "graphql", "grpc", "websockets", "nodejs", "bun", "deno", "express", "nestjs", "fastify", "python", "django", "fastapi", "flask", "golang", "go", "rust", "java", "spring boot", "csharp", "dotnet", "ruby on rails", "php", "laravel", "event driven architecture", "cqrs", "event sourcing", "message brokers", "kafka", "rabbitmq", "activemq", "redis pubsub", "celery", "background jobs", "serverless functions", "api gateway", "kong", "apigee", "authentication", "authorization", "jwt", "oauth2", "caching", "redis", "memcached", "load balancing", "reverse proxy", "scalability", "high availability", "fault tolerance", "ddd", "domain driven design", "mvc", "webhooks"]
6	Cybersecurity & Vault	cybersecurity-vault	Sicurezza informatica, crittografia e Zero Trust.	🛡️	#ef4444	2026-10-07 18:49:19.37578	["cybersecurity", "infosec", "security", "zero trust", "pentesting", "penetration testing", "hacking", "ethical hacking", "red team", "blue team", "purple team", "owasp", "xss", "sqli", "csrf", "ssrf", "injection", "cryptography", "hashing", "encryption", "jwt", "oauth", "saml", "sso", "identity access management", "iam", "vault", "hashicorp vault", "secrets management", "malware analysis", "incident response", "forensics", "devsecops", "cloud security", "cspm", "social engineering", "phishing", "nmap", "wireshark", "burp suite", "kali linux", "metasploit", "cve", "vulnerabilities", "patch management", "compliance", "gdpr", "hipaa", "soc2", "threat intelligence", "ransomware", "ddos", "botnets", "waf", "firewall"]
7	DKP Ecosystem & Releases	dkp-ecosystem-releases	Changelog ufficiali, rilasci di versione, architettura DKP, nuovi tool DKP e aggiornamenti di sistema.	🚀	#f59e0b	2026-10-07 18:49:20.486979	[]
8	Databases & Data Pipeline	databases-data-pipeline	Database serverless su Neon Postgres SQL, ORM (Drizzle/Prisma), caching, gestione e streaming dati.	📊	#1e50e6	2026-10-07 18:49:21.367684	[]
1	Tech & Architecture	tech-architecture	Approfondimenti e guide pratiche su architetture software, ambienti cloud e infrastrutture moderne.	⚡	#bc1010	2026-10-07 18:21:46.475409	[]
9	Linguaggi di Programmazione & Framework	linguaggi-programmazione-framework	Guide, approfondimenti e novità sui principali linguaggi di programmazione e framework. TypeScript, Rust, Go e sviluppo di sistemi avanzati.	📦	#19572e	2026-10-07 18:49:22.473424	[]
10	Low-Level & Kernel Engineering	low-level-kernel-engineering	Sviluppo in Rust, C/C++, ottimizzazione memoria, kernel Linux e kernel proprietari, programmazione di sistema e sistemi ad alte prestazioni.	🧬	#00dc82	2026-10-07 18:49:23.607621	[]
11	Web Dev & Modern Frameworks	web-dev-modern-frameworks	Ecosistema Nuxt 4, Vue 3, TypeScript, architetture frontend e librerie moderne, SSR e componenti ad alte prestazioni.	💻	#ec4899	2026-10-07 18:49:25.154926	[]
16	Mobile Development	mobile-development	Sviluppo app native, cross-platform e ottimizzazione.	📱	#10b981	2026-10-11 07:54:29.119087	["mobile", "app development", "ios", "android", "cross platform", "native", "react native", "expo", "flutter", "dart", "swift", "swiftui", "kotlin", "jetpack compose", "objective-c", "java", "kotlin multiplatform", "kmp", "ionic", "capacitor", "tauri", "mobile security", "app store", "google play", "aso", "app store optimization", "mobile ci/cd", "fastlane", "bitrise", "augmented reality", "arkit", "arcore", "wearables", "watchos", "wearos", "iot", "bluetooth low energy", "ble", "mobile testing", "appium", "detox", "offline first", "sqlite mobile", "push notifications", "fcm", "apns", "in-app purchases", "biometrics", "mobile performance", "memory leaks"]
17	Software Engineering & Architecture	software-engineering	Design pattern, clean code e metodologie.	📐	#64748b	2026-10-11 07:54:32.725489	["software engineering", "architecture", "system design", "design patterns", "clean code", "clean architecture", "hexagonal architecture", "solid principles", "dry", "kiss", "yagni", "domain driven design", "ddd", "test driven development", "tdd", "bdd", "agile", "scrum", "kanban", "extreme programming", "xp", "open source", "oss", "code review", "refactoring", "technical debt", "uml", "sequence diagrams", "c4 model", "functional programming", "fp", "object oriented programming", "oop", "memory management", "garbage collection", "concurrency", "multithreading", "async", "parallelism", "scalability", "trade-offs", "algorithms", "data structures", "leetcode"]
18	Game Development	game-development	Motori grafici, fisica, rendering 3D e design.	🎮	#84cc16	2026-10-11 07:54:36.316968	["game development", "gamedev", "unity", "unity3d", "c#", "unreal engine", "c++", "blueprints", "godot", "gdscript", "html5 games", "phaser", "webgl", "shaders", "glsl", "hlsl", "game physics", "rigidbodies", "colliders", "game ai", "pathfinding", "navmesh", "behavior trees", "multiplayer", "netcode", "photon", "procedural generation", "perlin noise", "game design", "level design", "monetization", "f2p", "vr", "virtual reality", "ar", "xr", "oculus", "audio engineering", "fmod", "wwise", "2d animation", "spine2d", "pixel art", "3d modeling", "blender", "maya", "textures", "materials", "pbr", "rendering pipeline"]
15	Database & Data Engineering	database-data	Database relazionali, NoSQL, pipeline dati e ORM.	💾	#6366f1	2026-10-11 07:54:25.511685	["database", "dbms", "sql", "nosql", "relational", "postgresql", "mysql", "mariadb", "sqlite", "neon", "supabase", "document db", "mongodb", "couchdb", "key-value", "redis", "dynamodb", "wide-column", "cassandra", "scylladb", "graph db", "neo4j", "time-series", "influxdb", "timescale", "vector db", "pinecone", "milvus", "qdrant", "weaviate", "data engineering", "etl", "elt", "data warehouse", "snowflake", "bigquery", "redshift", "data lake", "apache spark", "hadoop", "apache flink", "kafka streams", "orm", "drizzle", "prisma", "typeorm", "sequelize", "sqlalchemy", "hibernate", "entity framework", "migrations", "database design", "normalization", "indexing", "performance tuning", "sharding", "replication", "acid", "cap theorem"]
19	IT Career & Tech Leadership	career-leadership	Crescita professionale, management e soft skills.	👔	#a855f7	2026-10-11 07:54:39.923222	["career", "tech leadership", "engineering management", "em", "tech lead", "staff engineer", "principal engineer", "developer productivity", "developer experience", "dx", "remote work", "asynchronous communication", "hiring", "interviewing", "coding interviews", "system design interviews", "mentorship", "onboarding", "tech startup", "startup ecosystem", "entrepreneurship", "freelancing", "consulting", "public speaking", "devrel", "developer relations", "developer advocacy", "technical writing", "blogging", "burnout", "mental health", "salary negotiation", "personal branding", "resume", "cv", "networking", "future of work", "remote culture", "imposter syndrome"]
\.


--
-- Data for Name: blog_comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_comments (id, blog_slug, author, content, points, created_at) FROM stdin;
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_posts (id, title, slug, content, excerpt, category_id, subcategory_id, author_id, status, is_verified, vault_certificate_id, vault_hash, views, likes, created_at, updated_at, tags) FROM stdin;
36	Tailwind CSS: creare un design system con design tokens	tailwind-css-creare-un-design-system-con-design-tokens	## Introduzione\nUn **design system** efficace è composto da regole, componenti e valori condivisi che garantiscono coerenza visiva e velocità di sviluppo. I **design tokens** sono la fonte di verità per quei valori (colori, spaziature, tipografia, radius, shadow, ecc.) e permettono di sincronizzare design e codice. **Tailwind CSS**, con la sua filosofia utility‑first e la configurabilità tramite `tailwind.config.js`, si presta molto bene a ospitare un sistema di **tokens centralizzato** e riutilizzabile. Questo articolo tecnico spiega come strutturare i token, integrarli in Tailwind, automatizzare l’esport da strumenti di design (es. **Figma**), e mantenere il sistema manutenibile e scalabile. Noi di DevKrnelPulse usiamo il Tailwind CSS per l'ecosistema.\n\n## 1. Cos’è un design token e perché usarlo\n\n**Design token** = unità atomica che rappresenta un valore di design (es. `color.primary`, `spacing.8`, `font.size.16`). I token separano il valore dalla sua rappresentazione (CSS, iOS, Android, JS), permettendo:\n- **Single source of truth** per i valori di design.\n- **Portabilità** tra piattaforme (web, mobile, native).\n- **Automazione**: generazione di varianti (dark mode, brand themes) e output multipli (CSS vars, Tailwind config, JSON).\n\n## 2. Strategie per modellare i token\n\nPrincipi:\n- **Semanticità**: preferire nomi semantici (`color.background.surface`) a nomi puramente estetici (`blue-500`) per facilitare cambi di palette e temi.\n- **Atomicità**: un token = un valore singolo.\n- **Scalabilità**: prevedere token per scale (spacing, type scale) e per varianti (light/dark, high‑contrast).\n\nEsempio di struttura JSON:\n\n```Json\n{\n  "color": {\n    "brand": { "primary": { "value": "#0ea5e9" } },\n    "ui": { "background": { "surface": { "value": "#ffffff" } } }\n  },\n  "spacing": {\n    "1": { "value": "4px" },\n    "2": { "value": "8px" }\n  },\n  "font": {\n    "size": { "base": { "value": "16px" }, "lg": { "value": "18px" } }\n  }\n}\n```\n## 3. Integrazione con Tailwind: approcci pratici\n\nEsistono due pattern principali per portare token in Tailwind:\n### A. Generare `tailwind.config.js` dai token\n- Trasforma i token in un oggetto JS che popola `theme.extend` (colors, spacing, fontSize, borderRadius, boxShadow).\n- Vantaggi: piena integrazione con le utility Tailwind; nessun runtime CSS extra.\n- Svantaggi: rebuild necessario ad ogni cambio token; meno flessibilità per runtime theming.\n\nEsempio:\n\n```Js\n// tailwind.config.js (generato)\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        primary: '#0ea5e9',\n        'surface-1': '#ffffff'\n      },\n      spacing: {\n        '1': '4px',\n        '2': '8px'\n      }\n    }\n  }\n}\n```\n### B. Esporre token come CSS Variables e usare Tailwind per utilities\n\n- Genera `:root` (o scope per tema) con `--token-name` e usa le variabili nelle utilities (es. `bg-[var(--color-primary)]` o tramite plugin che mappa variabili a classi).\n- Vantaggi: theming runtime (dark/light, brand switching) senza rebuild; compatibilità cross‑platform.\n- Svantaggi: alcune utility Tailwind non supportano direttamente CSS vars senza plugin; possibili problemi di JIT purging se non configurato correttamente.\n\nEsempio CSS vars:\n\n```Css\n:root {\n  --color-primary: #0ea5e9;\n  --spacing-1: 4px;\n}\n```\n## 4. Tooling: esportare token da Figma e trasformarli\n\nFlusso tipico:\n1. **Design** in Figma con tokens (color styles, text styles, spacing components).\n2. **Export**: plugin come Figma Tokens o Design Tokens esportano JSON.\n3. **Transform**: usare strumenti come Style Dictionary o Theo per convertire JSON in output multipli (CSS vars, JS, Swift, Android XML).\n4. **Build**: script CI generano `tailwind.config.js` e/o file CSS con variabili, commit automatico o pubblicazione su package registry interno.\n5. \nEsempio con Style Dictionary:\n- Definisci `tokens.json` → config Style Dictionary → build outputs (`css/variables.css`, `js/tokens.js`, `tailwind/tokens.js`).\n\n## 5. Theming e varianti (dark mode, brand themes)\n\nApproccio consigliato:\n- Mantieni token base (core) e definisci aliases semantici che puntano ai valori base. Per i temi, crea set di token che sovrascrivono gli alias.\n- Per runtime switching, usa CSS variables e classi di tema (`.theme-dark { --color-primary: ... })`. Tailwind può essere configurato per usare class strategy per dark mode (`darkMode: 'class'`).\n\nEsempio:\n\n```Css\n:root { --color-bg: #fff; --color-text: #111; }\n.theme-dark { --color-bg: #0b1220; --color-text: #e6eef8; }\n```\n## 6. Workflow CI/CD e governance dei token\n\nBest practice:\n- **Token as code**: versiona i token in repo separato o monorepo; ogni modifica passa da PR con review design + engineering.\n- **Automazione**: pipeline che genera output (Tailwind config, CSS vars) e pubblica pacchetti (npm, pnpm, internal registry).\n- **Testing visivo**: integra Storybook e visual regression testing (Chromatic, Percy) per catturare regressioni di design.\n- **Documentazione**: documenta token, semantica e regole d’uso (do/don’t) in un sito del design system.\n- **Change management**: breaking changes richiedono deprecation policy e migration guide.\n\n## 7. Esempi pratici e snippet utili\n\n### Generare CSS vars da token (Node script semplificato)\n\n```Js\nconst tokens = require('./tokens.json');\nconst fs = require('fs');\n\nfunction toCssVars(obj, prefix = '') {\n  return Object.entries(obj).map(([k,v]) => {\n    if (v.value) return `--${prefix}${k}: ${v.value};`;\n    return toCssVars(v, `${prefix}${k}-`);\n  }).flat().join('\\n');\n}\n```\n### Mappare CSS vars in Tailwind (plugin semplice)\n\n```Js\n// tailwind.config.js\nmodule.exports = {\n  theme: { extend: {} },\n  plugins: [\n    function({ addUtilities }) {\n      addUtilities({\n        '.bg-primary': { backgroundColor: 'var(--color-primary)' },\n        '.text-primary': { color: 'var(--color-primary)' }\n      })\n    }\n  ]\n}\n```\n## 8. Errori comuni e come evitarli\n- **Usare nomi cromatici direttamente** (`blue-500`) invece di nomi semantici → rende difficile rebranding.\n- **Mancata governance**: token sparsi in più repo senza controllo centralizzato.\n- **Non testare temi**: cambi di palette non verificati causano regressioni visive.\n- **Confusione tra token e component props**: i token devono rappresentare valori, non comportamenti dei componenti.\n\n## 9. Metriche di successo e manutenzione\n- **Tempo medio per creare un componente** (diminuisce con un buon design system).\n- **Numero di regressioni visive** (dovrebbe diminuire con test visivi).\n- **Frequenza di modifiche ai token e impatto** (breaking vs non‑breaking).\n- **Adozione**: percentuale di progetti che usano i token ufficiali.\n\n## Conclusione\nTailwind CSS e i design tokens formano una combinazione potente: Tailwind fornisce velocità e coerenza tramite utility, mentre i design tokens garantiscono una fonte di verità condivisa e portabile. Scegliere tra generare `tailwind.config.js` o usare CSS variables dipende dai requisiti di theming runtime e dalla necessità di rebuild. Automatizzare l’esport da Figma, trasformare i token con strumenti come Style Dictionary e integrare il processo in CI/CD e Storybook sono passi fondamentali per un design system scalabile e manutenibile.\n\n\n\n\n\n\n\n\n\n\n\n	Come progettare e implementare un design system basato su design tokens usando Tailwind CSS: struttura, workflow, integrazione con strumenti di token management e best practice per scalabilità e manutenzione.	11	39	1	published	t	DKP-VAULT-CERT-ADMIN-I76Q2U	cc2cda132cd5fc788cf50a5eef615089fca3e1b368d16e0fcbb18f43c8cb0451	9	2	2026-10-15 11:01:19.865715	2026-10-15 11:01:19.865715	["Tailwind CSS", "Design Tokens", "Design System", "CSS Variables", "Style Dictionary", "Figma", "Storybook", "Token Transform Tools", "PostCSS", "Vite/Next/Nuxt", "Theo", "UI Components", "Tailwind"]
25	Costruire un sistema RAG locale con Ollama e Qdrant	costruire-un-sistema-rag-locale-con-ollama-e-qdrant	## Introduzione\nLa Retrieval-Augmented Generation (RAG) è una strategia che combina **recupero di conoscenza** (retrieval) e **generazione** tramite modelli di linguaggio (LLM) per rispondere a query con informazioni aggiornate e contestualizzate. Implementare un sistema RAG in locale è utile per requisiti di privacy, latenza e controllo dei dati. In questo articolo descrivo un’architettura pratica e dettagliata per costruire un RAG locale usando **Ollama** come runtime LLM locale e **Qdrant** come vector database, con esempi e snippet in **Python**.\n## Panoramica dell’architettura\n\n| Componente | Ruolo principale |\n| --- | --- |\n| **Ollama** | Esecuzione locale di LLM; inferenza e completions; gestione modelli locali. |\n| **Qdrant** | Archiviazione vettoriale; nearest-neighbor search per retrieval. |\n| **Embeddings** | Trasformazione documenti/query in vettori (modello di embedding locale o remoto). |\n| **Orchestrazione Python** | Pipeline ETL, indicizzazione, retrieval, prompt engineering e post‑processing. |\n\n**Flusso operativo** (alto livello):\n1. **Ingest**: estrazione e pulizia dei documenti.\n2. **Embedding**: calcolo embedding per chunk di testo.\n3. **Indexing**: inserimento vettori in Qdrant con metadati.\n4. **Retrieval**: per ogni query, ricerca dei k nearest neighbors in Qdrant.\n5. **Generation**: costruzione del prompt con contesto recuperato e invio a Ollama.\n6. **Post-processing**: filtraggio, citazioni, controllo di coerenza.\n\n## Scelte tecniche e trade‑off\n- **Embeddings locali vs remoti**: usare un modello di embedding locale (se disponibile) riduce la dipendenza da servizi esterni e migliora privacy; tuttavia i modelli locali possono richiedere GPU e memoria.\n- **Dimensione dei chunk**: tipicamente 200–1000 token; bilanciare granularità (più piccoli → retrieval più preciso) e contesto (chunk troppo piccoli perdono coerenza).\n- **Metriche di similarità**: cosine è lo standard per embedding testuali; Qdrant supporta anche dot-product e altre metriche.\n- **Aggiornamento dell’indice**: per dataset dinamici, implementare strategie di upsert e re-embedding incrementale.\n\n## Prerequisiti e setup rapido\n- **Ambiente**: macchina Linux/macOS/Windows con Python 3.10+; preferibile GPU per embedding/LLM locali.\n- **Installazioni**:\n- - Qdrant (container Docker o servizio locale).\n- - Ollama (installazione locale secondo documentazione ufficiale).\n- - Librerie Python: `qdrant-client`, `requests` (o SDK Ollama se disponibile), `numpy`, `tiktoken`/tokenizer compatibile, `langchain` opzionale per orchestrazione.\n\nEsempio (pip):\n```Bash\npip install qdrant-client numpy requests\n```\nAvviare Qdrant (docker):\n```Bash\ndocker run -p 6333:6333 qdrant/qdrant\n```\n## Ingest e chunking (Python)\n1. **Estrazione**: PDF, Markdown, HTML, txt.\n2. **Chunking**: sliding window con overlap per preservare contesto.\n\n```Python\ndef chunk_text(text, chunk_size=800, overlap=100):\n    tokens = text.split()\n    chunks = []\n    i = 0\n    while i < len(tokens):\n        chunk = " ".join(tokens[i:i+chunk_size])\n        chunks.append(chunk)\n        i += chunk_size - overlap\n    return chunks\n```\n\n## Calcolo embedding\nScegliere un modello di embedding: se si usa un modello locale (es. Mistral/LLM con head embedding o modelli dedicati), integrare la chiamata locale; altrimenti usare un servizio esterno con attenzione alla privacy.\n\nEsempio generico (placeholder per funzione embedding locale):\n```Python\ndef embed_texts(texts):\n    # Restituisce numpy array shape (n_texts, dim)\n    # Implementare chiamata al modello di embedding locale o remoto\n    pass\n```\n## Indexing su Qdrant\nConnessione e creazione collection:\n```Python\nfrom qdrant_client import QdrantClient\nfrom qdrant_client.http import models as rest\n\nclient = QdrantClient(url="http://localhost:6333")\n\nclient.recreate_collection(\n    collection_name="docs",\n    vectors_config=rest.VectorParams(size=768, distance=rest.Distance.COSINE)\n)\n```\n\nUpsert dei vettori con metadati:\n```Python\npoints = [\n    {\n        "id": idx,\n        "vector": vector.tolist(),\n        "payload": {"text": chunk_text, "source": source, "chunk_id": idx}\n    }\n    for idx, (vector, chunk_text, source) in enumerate(data)\n]\n\nclient.upsert(collection_name="docs", points=points)\n```\n## Retrieval: query → nearest neighbors\nEsempio di ricerca:\n```Python\nquery_vec = embed_texts([query])[0]\nhits = client.search(collection_name="docs", query_vector=query_vec, limit=5)\n# hits contiene id, score, payload\n```\nStrategie:\n- **k dinamico**: adattare k in base alla lunghezza della query e alla confidenza.\n- **reranking**: opzionale, usare un modello di cross-encoder per riordinare i risultati più rilevanti.\n\n## Prompt engineering e composizione del contesto\n- I **top-k** chunk recuperati (con metadati e citazioni).\n- Istruzioni di sistema (system prompt) che definiscono il comportamento (es. sintetizza, cita le fonti, non inventare).\n- La query utente.\nEsempio di template:\n```Codice\nSystem: Sei un assistente tecnico. Usa solo le informazioni fornite nei documenti seguenti.\nDocumenti:\n[1] <testo chunk 1> (source: fileA.md)\n[2] <testo chunk 2> (source: fileB.pdf)\nDomanda: <user query>\nRisposta:\n```\nLimitare la lunghezza totale del prompt per rimanere entro i token supportati dal modello.\n\n## Chiamata a Ollama (inferenza locale)\nDipende dall’API/SDK di Ollama; in generale si invia il prompt e si riceve la completion. Esempio generico con `requests` (placeholder):\n```Python\nimport requests\n\ndef call_ollama(prompt, model="ollama-model-name"):\n    url = "http://localhost:11434/api/generate"  # esempio; verificare endpoint reale\n    payload = {"model": model, "prompt": prompt, "max_tokens": 512}\n    resp = requests.post(url, json=payload)\n    return resp.json()\n```\nBest practice:\n- Usare temperature basse per risposte più deterministiche.\n- Limitare `max_tokens` e gestire streaming se supportato per latenza migliore.\n\n## Controllo di qualità e sicurezza delle risposte\n- **Verifica delle affermazioni**: confrontare le risposte generate con i chunk recuperati; evidenziare le parti non supportate (hallucinations).\n- **Citazioni**: includere riferimenti ai payload.source e chunk_id per ogni affermazione presa dai documenti.\n- **Filtri**: rimuovere contenuti sensibili o non appropriati prima di esporre la risposta.\n\n## Esempio end‑to‑end minimale (scheletro)\n```Python\n# 1. Ingest -> chunks -> embeddings -> upsert (eseguito una tantum)\n# 2. Per ogni query:\nquery = "Come funziona il meccanismo di attention?"\nq_vec = embed_texts([query])[0]\nhits = client.search("docs", query_vector=q_vec, limit=5)\ncontext = "\\n\\n".join([f"[{i}] {h.payload['text']} (source: {h.payload['source']})" for i,h in enumerate(hits)])\nprompt = f"System: Usa solo i documenti seguenti.\\n\\n{context}\\n\\nDomanda: {query}\\nRisposta:"\nresp = call_ollama(prompt)\nprint(resp["text"])\n```\n## Ottimizzazioni avanzate\n- **Reranking con cross-encoder**: migliora precisione ma è più costoso computazionalmente.\n- **Hybrid search**: combinare BM25 (full-text) + vector search per coprire sinonimia e parole chiave.\n- **Sharding e replica**: per dataset molto grandi, distribuire collection Qdrant o usare partizionamento.\n- Caching: cache delle risposte per query frequenti; memorizzare embedding delle query per riuso.\n- **Monitoraggio**: metriche di latenza, tasso di hallucination, copertura delle fonti.\n\n## Considerazioni pratiche e limiti\n- **Risorse hardware**: LLM e embedding locali possono richiedere GPU e RAM significative; valutare modelli più leggeri per deployment su CPU.\n- **Manutenzione dell’indice**: re-embedding periodico se i modelli di embedding cambiano; versioning dei vettori.\n- **Privacy e compliance**: mantenere log e accessi controllati; cifrare i dati sensibili a riposo.\n\n## Conclusione e passi successivi\nUn sistema RAG locale con Ollama e Qdrant offre un buon compromesso tra **controllo dei dati**, **bassa latenza** e **qualità delle risposte** quando progettato con attenzione a embedding, chunking e prompt engineering. Per partire rapidamente:\n1. Avvia Qdrant in locale e crea la collection.\n2. Scegli o allena un modello di embedding compatibile (locale se possibile).\n3. Ingesta e indicizza i documenti.\n4. Implementa la pipeline di retrieval + prompt verso Ollama.\n5. Aggiungi monitoraggio, reranking e meccanismi anti‑hallucination.\n\nNel prossimo articolo forniremo un repository di esempio completo con script Python per ingest, embedding, indexing, query e il materiale in Markdown/README pronto all’uso. \n\nQui potrete trovare un repository di esempio in RAG locale con Ollama e Qdrant con file README completo\n\n[Repository di esempio: RAG locale con Ollama e Qdrant](https://devkernelpulse.org/blog/repository-di-esempio-rag-locale-con-ollama-e-qdrant-con-readme-completo)\n	In questo articolo andremo a vedere come costruire un sistema RAG locale con Ollama e Qdrant.\n	3	78	1	published	t	DKP-VAULT-CERT-ADMIN-W3JCV7	2936ba3da9eb563210ff0b847b66abe99f1a5beb476132e6c23d98698cd14d1a	4	1	2026-10-12 17:39:20.728909	2026-10-12 17:39:20.728909	["RAG", "Ollama", "Qdrant", "Local AI", "Python", "Vector Database", "Embeddings", "LLM"]
34	HashiCorp Vault: gestione sicura dei secrets in un’applicazione	hashicorp-vault-gestione-sicura-dei-secrets-in-un-applicazione	## Introduzione\n\nHashiCorp Vault è una soluzione matura per la **gestione centralizzata, sicura e auditabile dei secrets** (chiavi API, credenziali DB, certificati, token). Questo articolo tecnico spiega come progettare l’integrazione di Vault in un’applicazione, coprendo architettura, metodi di autenticazione, gestione dinamica dei secrets, policy, rotazione, auditing e operazioni quotidiane. Troverai esempi pratici, pattern consigliati e considerazioni per ambienti cloud‑native e on‑premise. Il nostro ecosistema si basa su questo utilizzando GCP KMS.\n\n## Perché usare Vault: problemi che risolve\n- **Segreti hardcoded**: elimina la necessità di inserire credenziali nel codice o nei repository.\n- **Rotazione e scadenza**: supporto nativo per credenziali dinamiche e TTL.\n- **Access control centralizzato**: policy basate su ACL per limitare l’accesso ai secrets.\n- **Audit e compliance**: logging delle richieste e integrazione con sistemi di audit.\n- **Crittografia come servizio**: transit engine per cifrare/decriptare dati senza esporre chiavi.\n\n**Architettura di riferimento**\n| Componente | Ruolo |\n| --- | --- |\n| **Vault Server** | Store cifrato dei secrets; motori di secret (KV, Database, PKI, Transit, AWS, etc.). |\n| **Storage Backend** | Backend persistente (Consul, Raft, cloud storage) per la durabilità. |\n| **Seal/Unseal** | Meccanismo di protezione delle chiavi master (auto-unseal con KMS consigliato). |\n| **Auth Methods** | Metodi di autenticazione (AppRole, Kubernetes, AWS IAM, OIDC, LDAP). |\n| **Clients / Agents** | Vault Agent, SDKs, sidecars per retrieval e caching dei secrets. |\n| **Audit Devices** | Sink per log (file, syslog, splunk, etc.). |\n\n**Pattern consigliato**: usare auto‑unseal con un KMS cloud (AWS KMS, Azure Key Vault, GCP KMS) o HSM in produzione per evitare operazioni manuali di unseal; usare Raft come storage backend per cluster Vault self‑managed se non si vuole dipendere da Consul.\n\n## Metodi di autenticazione: quale scegliere e quando\n\n- **Kubernetes Auth**: ideale per workload in cluster k8s; mappa service account a policy Vault.\n- **AppRole**: adatto per macchine virtuali, CI runners o servizi non‑k8s; combina role_id e secret_id.\n- **AWS/GCP/Azure IAM**: per workload cloud nativi che possono autenticarsi tramite identità del cloud.\n- **OIDC / JWT**: per integrazione con identity provider esterni (Okta, Auth0).\n- **Userpass/LDAP**: per accesso umano o integrazione con directory aziendali (meno consigliato per workload).\n\n**Raccomandazione**: preferire metodi che non richiedono segreti statici nel codice (Kubernetes, cloud IAM, OIDC). Quando si usa AppRole, proteggere secret_id con delivery sicuro (es. short‑lived bootstrap token).\n\n## Motori di secret e casi d’uso pratici\n- **KV (v2)**: storage di secrets statici con versioning; utile per configurazioni e segreti non dinamici.\n- **Database Secrets Engine**: genera credenziali DB dinamiche con TTL; riduce blast radius in caso di compromissione.\n- **PKI**: emette certificati TLS on‑demand; utile per mTLS e rotazione automatica dei certificati.\n- **Transit**: cifratura/decrittografia come servizio; utile per proteggere dati applicativi senza esporre chiavi.\n- **Cloud Secrets Engines**: crea credenziali cloud temporanee (IAM) per accesso a risorse cloud.\n\n**Pattern**: usare credenziali dinamiche (Database, Cloud) quando possibile; usare KV per segreti che non possono essere dinamici ma applicare rotazione e versioning.\n\n## Integrazione applicativa: pattern e strumenti\n**Vault Agent / Sidecar**\n- Esegue autenticazione, rinnova token e scrive secrets in file locali o in-memory.\n- Riduce latenza e semplifica SDK nell’applicazione.\n- Pattern: sidecar per pod Kubernetes o daemonset per nodi.\n**Direct SDK calls**\n- L’app chiama Vault tramite SDK (Go, Python, Java).\n- Richiede gestione token e rinnovo; preferibile per applicazioni con logica di secret-aware.\n**Template rendering**\n- Vault Agent Template (consul-template style) per generare file di configurazione con secrets aggiornati.\n**Env injection**\n- Evitare di esporre secrets come variabili d’ambiente persistenti; preferire file in-memory o mount temporanei.\n\n### Esempio Kubernetes (Kubernetes Auth + Vault Agent sidecar):\n- Configura `ServiceAccount` e `Role` in `Vault`.\n- Pod spec include sidecar `vault-agent` che autentica con Kubernetes auth, recupera secrets e li rende disponibili in `/vault/secrets` come file con permessi restritti.\n- L’app legge i secrets da quel path al runtime.\n\n## Policy e controllo degli accessi (ACL)\n- **Least privilege**: definire policy minime per ogni role/servizio.\n- **Namespaces**: usare namespaces in Vault (Enterprise) per isolamento multi‑tenant.\n- **Path-based policies**: limitare accesso a path specifici (`kv/data/appX/*`, `database/creds/appX`).\n- **Token scopes e TTL**: impostare TTL brevi e abilitare renew solo quando necessario.\n- **Response wrapping**: per consegna sicura di segreti sensibili (es. secret_id AppRole) usare response-wrapping per short-lived single-use tokens.\n\nEsempio policy HCL:\n```Hcl\npath "database/creds/app-read" {\n  capabilities = ["read"]\n}\n\npath "kv/data/app/config" {\n  capabilities = ["read"]\n}\n```\n\n## Rotazione e lifecycle dei secrets\n- **Dynamic secrets**: Vault può creare e revocare credenziali automaticamente (DB, cloud). Impostare TTL e max TTL coerenti con la policy di sicurezza.\n- **Static secrets**: definire processi di rotazione automatizzati (CI job) e versioning (KV v2).\n- **Certificati**: usare PKI per emettere certificati con breve TTL e automatizzare rinnovo tramite sidecar/agent.\n- **Revocation**: usare endpoint di revocation per invalidare token/credenziali compromesse; integrare con incident response.\n\n## Audit e monitoring\n- **Audit devices**: abilitare audit logging (file, syslog, splunk) per tutte le richieste; log contengono metadata ma non il valore dei secrets.\n- **Alerting**: monitorare errori di autenticazione, tassi di rinnovo falliti, revocation events.\n- **Metrics**: esporre metriche (Prometheus) per latenza, errori, throughput; monitorare storage backend health.\n- **Retention**: definire politiche di retention dei log per compliance.\n\n## High availability, backup e disaster recovery\n- **Storage backend**: scegliere Raft per cluster Vault self‑managed o Consul per compatibilità storica.\n- **Auto-unseal**: usare KMS/HSM per auto‑unseal e ridurre operazioni manuali.\n- **Backup**: backup regolari del backend (consul snapshot o snapshot Raft) e test di restore.\n- **DR**: pianificare recovery time objectives (RTO) e recovery point objectives (RPO); testare failover e restore periodicamente.\n\n## Sicurezza operativa e hardening\n- **Network segmentation**: limitare accesso a Vault a livello di rete (private subnets, security groups).\n- **TLS everywhere**: obbligare TLS per tutte le comunicazioni; usare certificati gestiti da PKI di Vault o CA aziendale.\n- **Least privilege IAM**: per auto‑unseal e integrazioni cloud, usare ruoli con permessi minimi.\n- **Secret zero problem**: minimizzare bootstrap secrets; usare cloud IAM/Kubernetes service account per bootstrap.\n- **Secret exposure mitigation**: evitare logging dei valori dei secrets; sanificare stack traces e log.\n\n## Esempio pratico: flusso di autenticazione Kubernetes + retrieval KV\n\n**Enable Kubernetes auth** in Vault e configurare role:\n- Mappare `serviceAccountName` del pod a una policy Vault.\n\n**Pod** monta `vault-agent` sidecar che:\n- Richiede JWT del service account al token reviewer endpoint.\n- Chiama Vault Kubernetes auth per ottenere token Vault.\n- Recupera secrets KV e li scrive in un file con permessi 0600.\n\n**App** legge i secrets dal file all’avvio; il sidecar rinnova i token e aggiorna i file quando necessario.\n\n## CI/CD e provisioning: integrazione con Terraform e pipeline\n- **Terraform + Vault provider**: gestire policy, roles e mount points come codice.\n- **Bootstrap in CI**: usare short‑lived AppRole/CI tokens per pipeline; evitare segreti statici nel runner.\n- **Secret injection in pipelines**: usare Vault Agent Injector o fetch dinamico in job; non salvare secrets nei logs.\n- **Promotion**: per promuovere segreti tra ambienti, usare approvazioni manuali e non ricreare segreti in prod senza controllo.\n\n## Errori comuni e come evitarli\n- **Hardcoding secrets**: mai inserire segreti in repo; usare Vault o secret manager.\n- **Permessi troppo larghi**: evitare policy `path "*" { capabilities = ["read"] }`.\n- **Mancata rotazione**: non avere processi di rotazione per segreti statici.\n- **No audit**: non abilitare audit logging rende difficile investigare incidenti.\n- **Single point of failure**: non prevedere auto‑unseal/HA e backup testati.\n\n## Checklist operativa rapida\n- [ ] Abilitare TLS e auto‑unseal (KMS/HSM).\n- [ ] Scegliere storage backend HA (Raft/Consul).\n- [ ] Configurare metodi di auth senza segreti statici (Kubernetes/IAM/OIDC).\n- [ ] Implementare Vault Agent sidecar per workload k8s.\n- [ ] Usare motori di secret dinamici (DB, Cloud, PKI) quando possibile.\n- [ ] Definire policy di least privilege e TTL brevi.\n- [ ] Abilitare audit logging e integrazione con SIEM.\n- [ ] Automatizzare backup e test di restore.\n- [ ] Integrare Vault con IaC (Terraform) e CI/CD (pipeline con short‑lived tokens).\n\n## Conclusione\n\n**HashiCorp Vault** è uno strumento potente per centralizzare la gestione dei secrets e ridurre il rischio operativo legato a credenziali statiche. Una corretta integrazione richiede attenzione **all’autenticazione dei workload**, all’**uso di secrets dinamici**, alla **definizione di policy** restrittive, e a solide pratiche operative (audit, backup, auto‑unseal). Implementando i pattern descritti qui — Vault Agent sidecar, Kubernetes auth, motori dinamici e automazione tramite Terraform/CI — puoi ottenere un sistema di secrets management sicuro, scalabile e manutenibile.\n\n\n\n\n\n\n\n\n\n\n\n\n	Guida tecnica e approfondita su come integrare HashiCorp Vault per la gestione sicura dei secrets in applicazioni moderne: architettura, autenticazione, rotazione, policy e best practice operative.\n	6	202	1	published	t	DKP-VAULT-CERT-ADMIN-4NFT3G	8e4a2d78538347869a89b22977f3b03d71ab6212541dd16cc48e1dfa5a380d30	17	1	2026-10-14 06:16:45.09765	2026-10-14 06:16:45.09765	["HashiCorp Vault", "Secrets Management", "Encryption", "Kubernetes", "Vault Agent", "Dynamic Secrets", "Policy", "PKI", "Consul", "Docker", "Terraform", "Vault SDK", "CI/CD", "AWS KMS", "Azure Key Vault", "GCP KMS"]
35	Come funziona una blockchain: blocchi, transazioni, nodi e consenso	come-funziona-una-blockchain-blocchi-transazioni-nodi-e-consenso	## Introduzione\n\nLa blockchain è spesso descritta come un “registro distribuito”, ma questa definizione non rende giustizia alla complessità del sistema. Una blockchain è un **protocollo decentralizzato** che permette a più attori di concordare sullo stato di un database senza un’autorità centrale. Per capire davvero come funziona, dobbiamo analizzare i suoi componenti fondamentali: **blocchi**, **transazioni**, **nodi** e **meccanismi di consenso**.\n\nIn questo articolo esploriamo la blockchain da un punto di vista tecnico, con un approccio chiaro e approfondito pensato per sviluppatori, ingegneri e professionisti Web3.\n\n## 1. Le transazioni: l’unità minima di informazione\n\nUna blockchain registra **transazioni**, ovvero operazioni che modificano lo stato del sistema.\nEsempi:\n- trasferimento di criptovalute\n- esecuzione di funzioni di uno smart contract\n- aggiornamento di un asset digitale\n\nOgni transazione contiene:\n- **mittente** (public key)\n- **destinatario**\n- **firma digitale** (garantisce autenticità)\n- **nonce** (previene replay)\n- **fee** (incentivo per i validatori)\nPrima di essere inserite in un blocco, le transazioni vengono propagate nella rete peer‑to‑peer e validate dai nodi.\n \n## 2. I blocchi: contenitori crittografici\n\nUn blocco è un insieme ordinato di transazioni più alcuni metadati.\nStruttura tipica:\n\n**Header del blocco**\n- hash del blocco precedente\n- timestamp\n- root del Merkle Tree\n- difficoltà (PoW) o dati di validazione (PoS)\n\n**Body del blocco**\n- lista delle transazioni\n\n### Merkle Tree: perché è fondamentale\nLe transazioni vengono organizzate in un Merkle Tree, una struttura ad albero che permette:\n- verifiche efficienti (Merkle Proof)\n- integrità dei dati\n- riduzione della quantità di informazioni da trasmettere\nIl Merkle Root rappresenta l’hash crittografico dell’intero set di transazioni.\n\n## 3. I nodi: la rete decentralizzata\n\nUna blockchain è mantenuta da una rete di nodi.\nTipologie principali:\n\n### Full Node\n- conserva l’intera blockchain\n- verifica ogni transazione e blocco\n- applica le regole del protocollo\n\n### Light Node\n- conserva solo i blocchi recenti\n- usa Merkle Proof per verificare transazioni\n\n### Miner / Validator\n- produce nuovi blocchi\n- partecipa al consenso\n- riceve ricompense (block reward + fee)\n\n### Archivio / RPC Node\n- fornisce API per applicazioni Web3\n- conserva dati storici completi\nLa decentralizzazione deriva dal fatto che nessun nodo è gerarchicamente superiore agli altri.\n\n## 4. Il consenso: come la rete “decide” la verità\n\nIl consenso è il cuore della blockchain: un meccanismo che permette ai nodi di concordare sullo stato del ledger.\n\n### Proof‑of‑Work (PoW)\n\nUsato da **Bitcoin**.\nFunzionamento:\n1. i miner competono per risolvere un puzzle crittografico\n2. il primo che trova la soluzione propone un blocco\n3. la rete verifica la validità\n4. il blocco viene aggiunto alla catena\n\nCaratteristiche:\n- sicurezza elevata\n- consumo energetico significativo\n- difficoltà regolata dinamicamente\n\n### Proof‑of‑Stake (PoS)\n\nUsato da **Ethereum** (post‑Merge).\nFunzionamento:\n1. i validatori depositano una quantità di token (stake)\n2. vengono selezionati pseudo‑casualmente per proporre blocchi\n3. la rete vota e finalizza\n4. comportamenti malevoli portano a penalità (slashing)\n\nCaratteristiche:\n- efficienza energetica\n- maggiore scalabilità\n- incentivi economici per la sicurezza\n\n### Altri meccanismi\n- **DPoS** (Delegated Proof‑of‑Stake)\n- **PBFT** (Practical Byzantine Fault Tolerance)\n- **PoA** (Proof‑of‑Authority)\nOgni meccanismo bilancia sicurezza, decentralizzazione e performance.\n\n## 5. La catena dei blocchi: immutabilità e sicurezza\n\nOgni blocco contiene l’hash del blocco precedente.\nQuesto crea una **catena crittografica**:\n\n```Codice\nBlocco N → hash(BN-1)\nBlocco N-1 → hash(BN-2)\n...\n```\nSe un attaccante volesse modificare una transazione nel blocco N‑10:\n- dovrebbe ricostruire tutti i blocchi successivi\n- dovrebbe superare la potenza di calcolo o lo stake della rete\n- la rete rifiuterebbe i blocchi non validi\nQuesto rende la blockchain immutabile e resistente a manomissioni.\n\n## 6. Fork: quando la catena si divide\nUn fork è una divergenza temporanea o permanente della catena.\n\n### Soft Fork\n- compatibile con le versioni precedenti\n- modifica le regole senza rompere la rete\n\n### Hard Fork\n- modifica incompatibile\n- richiede aggiornamento dei nodi\n- può creare due blockchain separate (es. ETH/ETC)\nI fork sono parte naturale dell’evoluzione del protocollo.\n\n## 7. Smart contract: logica programmabile\n\nSu blockchain come Ethereum, i blocchi non contengono solo transazioni ma anche **codice eseguibile**.\n\nGli smart contract:\n- definiscono regole automatiche\n- sono immutabili una volta deployati\n- gestiscono asset, token, NFT, DAO\n- permettono applicazioni decentralizzate (dApp)\nEsecuzione deterministica: ogni nodo deve ottenere lo stesso risultato.\n\n## 8. Sicurezza: perché la blockchain è considerata affidabile\n\nLa sicurezza deriva da:\n- crittografia (hashing, firme digitali)\n- decentralizzazione (assenza di single point of failure)\n- consenso distribuito\n- immutabilità dei dati\n- incentivi economici (reward, slashing)\nUna blockchain ben progettata è resistente a:\n- attacchi Sybil\n- double‑spending\n- manomissione dei dati\n- collusioni tra nodi (fino a un certo limite)\n\n## Conclusione\n\nUna blockchain è molto più di un registro distribuito: è un sistema complesso che combina crittografia, teoria dei giochi, reti peer‑to‑peer e meccanismi di consenso per garantire sicurezza e decentralizzazione. Capire blocchi, transazioni, nodi e consenso è essenziale per chiunque voglia lavorare nel mondo Web3, sviluppare smart contract o progettare applicazioni decentralizzate.\n\n\n\n\n\n\n	Una guida tecnica e approfondita che spiega come funziona una blockchain dall’interno: struttura dei blocchi, validazione delle transazioni, ruolo dei nodi e meccanismi di consenso distribuito.\n	4	50	1	published	t	DKP-VAULT-CERT-ADMIN-SIPHX0	2eeb0066c155eb28867709557536d992c2a79517a551a7cf1c61e13913cf462c	2	2	2026-10-15 07:49:14.170333	2026-10-15 07:49:14.170333	["Blockchain", "Web3", "Distributed Systems", "Consensus", "PoW", "PoS", "Merkle Tree", "Cryptography", "Blockchain Layer‑1", "Peer‑to‑Peer Network", "Hashing (SHA‑256)", "Proof‑of‑Work", "Proof‑of‑Stake", "Smart Contracts"]
30	Repository di esempio: Ollama + Nuxt 4 Modules + integrazione Python (README e file pronti)	repository-di-esempio-ollama-nuxt-4-modules-integrazione-python-readme-e-file-pronti	## Repository di esempio con Ollama + Nuxt 4 Modules + integrazione Python e README con file pronti\n\nDi seguito trovi un repository completo e pronto all’uso che integra Ollama con un’app Nuxt 4 (modulo personalizzato + server routes) e include script Python per ingest, embedding, indexing e query verso Qdrant. Tutti i file sono forniti in formato testo: puoi copiarli direttamente nel tuo progetto.\n## Struttura del repository proposta\n\n```Codice\nnuxt-ollama-example/\n├─ README.md\n├─ package.json\n├─ nuxt.config.ts\n├─ .env.example\n├─ server/\n│  ├─ api/\n│  │  ├─ ai/\n│  │  │  └─ query.post.ts\n│  │  └─ ollama/\n│  │     └─ proxy.post.ts\n│  └─ utils/\n│     └─ prompt.ts\n├─ modules/\n│  └─ nuxt-ollama/\n│     ├─ index.ts\n│     └─ runtime.d.ts\n├─ client/\n│  └─ composables/\n│     └─ useAi.ts\n├─ python/\n│  ├─ requirements.txt\n│  ├─ .env.example\n│  ├─ scripts/\n│  │  ├─ ingest.py\n│  │  ├─ embed_and_index.py\n│  │  └─ query.py\n│  └─ utils.py\n└─ docs/\n   └─ quickstart.md\n```\n## README.md (file principale)\n\n```Markdown\n# Nuxt + Ollama Example — Integrazione LLM locale\n\n**Descrizione**  \nEsempio completo che mostra come integrare Ollama (runtime LLM locale) con Nuxt 4 tramite un modulo personalizzato e server routes. Include anche script Python per pipeline RAG: ingest, chunking, embedding, indexing su Qdrant e query che costruiscono prompt e chiamano Ollama.\n\n**Stack**\n- Nuxt 4 (Node 18+)\n- Ollama (runtime LLM locale)\n- Qdrant (vector DB)\n- Python 3.10+ per script di ingest/embedding/indexing\n\n---\n\n## Requisiti\n\n- Node.js 18+\n- Python 3.10+\n- Docker (opzionale, per Qdrant)\n- Ollama installato e modelli locali disponibili\n```\n\n- **Clona il repository**:\n```bash\n## Installazione (Nuxt)\ngit clone <repo-url> nuxt-ollama-example\ncd nuxt-ollama-example\n```\n-  **Installa dipendenze Node:**\n```bash\nnpm install\n```\n-  **Copia e configura** `.env`:\n```bash\ncp .env.example .env\n# Modifica le variabili: OLLAMA_URL, OLLAMA_MODEL, QDRANT_URL, ecc.\n```\n-  **Avvia Nuxt in sviluppo**:\n```bash\nnpm run dev\n```\n## Componenti principali\n### Modulo Nuxt `modules/nuxt-ollama`\n- Incapsula configurazione Ollama (baseUrl, model).\n- Registra server route proxy per chiamate sicure a Ollama.\n### Server routes\n- `/api/ollama/proxy` — proxy server-side verso Ollama (autenticato).\n- `/api/ai/query` — endpoint che riceve query, esegue retrieval (opzionale), costruisce prompt e chiama Ollama.\n## Client\n- `client/composables/useAi.ts` — helper composable per chiamare `/api/ai/query`.\n## Python scripts\n- `python/scripts/ingest.py` — estrazione e chunking dei documenti.\n- `python/scripts/query.py` — esempio CLI per query + generazione con Ollama.\n\n### Esempio di flusso\n1. Popola `python/data/raw/` con documenti.\n2. Esegui `python/scripts/ingest.py`.\n3. Esegui `python/scripts/embed_and_index.py` (configura embedding).\n4. Avvia Nuxt; usa l’interfaccia client o `curl` verso `/api/ai/query` per inviare query.\n5. Il server recupera top-k chunk da Qdrant, costruisce prompt e chiama Ollama tramite `/api/ollama/proxy`.\n### Sicurezza e best practice\n- Non esporre Ollama direttamente al client.\n- Proteggi le server routes con autenticazione (JWT/session).\n- Applica rate limiting e logging.\n- Versiona i template di prompt e i modelli.\n## Licenza\n### MIT\n\n```Codice\n---\n\n## File: package.json\n\n``json\n{\n  "name": "nuxt-ollama-example",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "dev": "nuxi dev",\n    "build": "nuxi build",\n    "start": "nuxi preview",\n    "lint": "eslint . --ext .ts,.js,.vue"\n  },\n  "dependencies": {\n    "nuxt": "4",\n    "ohmyfetch": "^1.2.0"\n  },\n  "devDependencies": {\n    "@types/node": "^18.0.0",\n    "typescript": "^5.0.0"\n  }\n}\n```\n## File: .env.example (root)\n\n```Codice\n# Nuxt / Ollama\nOLLAMA_URL=http://localhost:11434\nOLLAMA_MODEL=your-ollama-model\nOLLAMA_API_KEY=\n\n# Qdrant (se usi retrieval)\nQDRANT_URL=http://localhost:6333\nQDRANT_COLLECTION=docs\nVECTOR_DIM=768\n```\n## File: nuxt.config.ts\n\n```Ts\nimport { defineNuxtConfig } from 'nuxt'\n\nexport default defineNuxtConfig({\n  modules: [\n    // registra il modulo locale\n    '~/modules/nuxt-ollama'\n  ],\n  runtimeConfig: {\n    public: {\n      // eventuali config pubbliche\n    },\n    ollama: {\n      baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',\n      model: process.env.OLLAMA_MODEL || 'your-ollama-model'\n    }\n  }\n})\n```\n## Module: modules/nuxt-ollama/index.ts\n\n```Ts\nimport { defineNuxtModule, addServerHandler } from '@nuxt/kit'\n\nexport default defineNuxtModule({\n  meta: { name: 'nuxt-ollama' },\n  defaults: {\n    baseUrl: 'http://localhost:11434',\n    model: 'your-ollama-model'\n  },\n  setup(options, nuxt) {\n    // esporre runtime config\n    nuxt.options.runtimeConfig = nuxt.options.runtimeConfig || {}\n    nuxt.options.runtimeConfig.ollama = {\n      baseUrl: process.env.OLLAMA_URL || options.baseUrl,\n      model: process.env.OLLAMA_MODEL || options.model\n    }\n\n    // aggiungi server handler proxy per Ollama\n    addServerHandler({\n      route: '/api/ollama/proxy',\n      handler: '~/server/api/ollama/proxy.post.ts'\n    })\n  }\n})\n```\n## Server route: server/api/ollama/proxy.post.ts\n\n```Ts\nimport { defineEventHandler, readBody } from 'h3'\nimport { $fetch } from 'ohmyfetch'\n\nexport default defineEventHandler(async (event) => {\n  // Proteggi l'endpoint: aggiungi autenticazione qui\n  const body = await readBody(event)\n  const config = useRuntimeConfig().ollama\n  const url = `${config.baseUrl}/api/generate` // verifica endpoint Ollama locale\n\n  // Forward request to Ollama (server-side)\n  const resp = await $fetch(url, {\n    method: 'POST',\n    body,\n    timeout: 60000\n  })\n\n  return resp\n})\n```\n> Nota: verifica l’endpoint e il payload richiesto dalla tua versione di Ollama; alcuni setup usano endpoint diversi o payload con campi differenti.\n\n## Server route: server/api/ai/query.post.ts\n\n```Ts\nimport { defineEventHandler, readBody } from 'h3'\nimport { $fetch } from 'ohmyfetch'\n\nasync function retrieveTopK(queryVec, k = 5) {\n  // Implementa retrieval verso Qdrant se necessario (server-side)\n  // Esempio: fetch a Qdrant REST API o usare client Node\n  return [] // ritorna array di { text, source }\n}\n\nfunction buildPrompt(chunks, userQuery) {\n  const context = chunks.map((c, i) => `[${i}] ${c.text} (source: ${c.source})`).join('\\n\\n')\n  return `System: Sei un assistente tecnico. Usa solo le informazioni fornite.\\n\\n${context}\\n\\nDomanda: ${userQuery}\\nRisposta:`\n}\n\nexport default defineEventHandler(async (event) => {\n  const body = await readBody(event)\n  const userQuery = body.query\n  // autenticazione e rate limiting qui\n\n  // 1) retrieval (opzionale)\n  const chunks = await retrieveTopK(null, 5)\n\n  // 2) build prompt\n  const prompt = buildPrompt(chunks, userQuery)\n\n  // 3) call Ollama via proxy\n  const config = useRuntimeConfig().ollama\n  const resp = await $fetch('/api/ollama/proxy', {\n    method: 'POST',\n    body: { model: config.model, prompt, max_tokens: 512, temperature: 0.2 }\n  })\n\n  // 4) post-process e ritorno\n  return {\n    answer: resp,\n    sources: chunks.map(c => c.source)\n  }\n})\n```\n## Server util: server/utils/prompt.ts\n\n```Ts\nexport function truncateContextByTokens(contextStr: string, maxTokens = 3000) {\n  // Implementa token counting e troncamento in base al tokenizer del modello\n  // Placeholder: ritorna la stringa così com'è\n  return contextStr\n}\n```\n## Client composable: client/composables/useAi.ts\n\n```Ts\nimport { ref } from 'vue'\nimport { useFetch } from '#app'\n\nexport function useAi() {\n  const loading = ref(false)\n  const answer = ref(null)\n  const sources = ref([])\n\n  async function ask(query: string) {\n    loading.value = true\n    const { data } = await useFetch('/api/ai/query', {\n      method: 'POST',\n      body: { query }\n    })\n    answer.value = data.value?.answer\n    sources.value = data.value?.sources || []\n    loading.value = false\n  }\n\n  return { loading, answer, sources, ask }\n}\n```\n## Python: requirements e .env\n`python/requirements.txt`\n\n```Codice\nqdrant-client==1.9.0\nnumpy\nrequests\npython-dotenv\ntqdm\n```\n`python/.env.example`\n\n```Codice\nQDRANT_URL=http://localhost:6333\nQDRANT_COLLECTION=docs\nVECTOR_DIM=768\nOLLAMA_URL=http://localhost:11434\nOLLAMA_MODEL=your-ollama-model\n```\n## Python script: python/utils.py\n\n```Python\nimport os\nimport json\nfrom pathlib import Path\n\ndef read_text_file(path: str) -> str:\n    with open(path, "r", encoding="utf-8") as f:\n        return f.read()\n\ndef save_jsonl(items, out_path):\n    with open(out_path, "w", encoding="utf-8") as f:\n        for it in items:\n            f.write(json.dumps(it, ensure_ascii=False) + "\\n")\n\ndef chunk_text(text, chunk_size=800, overlap=100):\n    tokens = text.split()\n    chunks = []\n    i = 0\n    idx = 0\n    while i < len(tokens):\n        chunk = " ".join(tokens[i:i+chunk_size])\n        chunks.append({"chunk_id": idx, "text": chunk})\n        idx += 1\n        i += chunk_size - overlap\n    return chunks\n```\n## Python script: python/scripts/ingest.py\n\n```Python\nimport os\nfrom pathlib import Path\nfrom python.utils import read_text_file, chunk_text, save_jsonl\n\nRAW_DIR = Path("python/data/raw")\nPROC_DIR = Path("python/data/processed")\nPROC_DIR.mkdir(parents=True, exist_ok=True)\n\ndef ingest():\n    all_chunks = []\n    for file in RAW_DIR.iterdir():\n        if file.suffix.lower() not in [".txt", ".md"]:\n            continue\n        text = read_text_file(file)\n        chunks = chunk_text(text, chunk_size=int(os.getenv("CHUNK_SIZE", 800)), overlap=int(os.getenv("CHUNK_OVERLAP", 100)))\n        for c in chunks:\n            all_chunks.append({\n                "source": str(file.name),\n                "chunk_id": c["chunk_id"],\n                "text": c["text"]\n            })\n    out_path = PROC_DIR / "chunks.jsonl"\n    save_jsonl(all_chunks, out_path)\n    print(f"Saved {len(all_chunks)} chunks to {out_path}")\n\nif __name__ == "__main__":\n    ingest()\n```\n## Python script: python/scripts/embed_and_index.py\n\n```Python\nimport os\nimport json\nimport numpy as np\nfrom pathlib import Path\nfrom qdrant_client import QdrantClient\nfrom qdrant_client.http import models as rest\n\nPROC_DIR = Path("python/data/processed")\nCHUNKS_FILE = PROC_DIR / "chunks.jsonl"\n\nQDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")\nCOLLECTION = os.getenv("QDRANT_COLLECTION", "docs")\nVECTOR_DIM = int(os.getenv("VECTOR_DIM", 768))\n\nclient = QdrantClient(url=QDRANT_URL)\n\ndef embed_texts(texts):\n    # Sostituisci con embedding reali\n    return np.random.rand(len(texts), VECTOR_DIM).astype(np.float32)\n\ndef load_chunks():\n    chunks = []\n    with open(CHUNKS_FILE, "r", encoding="utf-8") as f:\n        for line in f:\n            chunks.append(json.loads(line))\n    return chunks\n\ndef create_collection():\n    try:\n        client.delete_collection(collection_name=COLLECTION)\n    except Exception:\n        pass\n    client.recreate_collection(\n        collection_name=COLLECTION,\n        vectors_config=rest.VectorParams(size=VECTOR_DIM, distance=rest.Distance.COSINE)\n    )\n\ndef upsert_chunks(chunks, vectors):\n    points = []\n    for idx, (chunk, vec) in enumerate(zip(chunks, vectors)):\n        points.append({\n            "id": idx,\n            "vector": vec.tolist(),\n            "payload": {"text": chunk["text"], "source": chunk["source"], "chunk_id": chunk["chunk_id"]}\n        })\n    client.upsert(collection_name=COLLECTION, points=points)\n    print(f"Upserted {len(points)} points to Qdrant collection '{COLLECTION}'")\n\ndef main():\n    chunks = load_chunks()\n    texts = [c["text"] for c in chunks]\n    vectors = embed_texts(texts)\n    create_collection()\n    upsert_chunks(chunks, vectors)\n\nif __name__ == "__main__":\n    main()\n```\n## Python script: python/scripts/query.py\n\n```Python\nimport os\nimport json\nimport argparse\nimport numpy as np\nimport requests\nfrom qdrant_client import QdrantClient\n\nQDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")\nCOLLECTION = os.getenv("QDRANT_COLLECTION", "docs")\nOLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")\nOLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "your-ollama-model")\nVECTOR_DIM = int(os.getenv("VECTOR_DIM", 768))\n\nclient = QdrantClient(url=QDRANT_URL)\n\ndef embed_texts(texts):\n    # Sostituisci con embedding reali\n    return np.random.rand(len(texts), VECTOR_DIM).astype(np.float32)\n\ndef build_prompt(chunks, query):\n    context = "\\n\\n".join([f"[{i}] {c['payload']['text']} (source: {c['payload']['source']})" for i,c in enumerate(chunks)])\n    prompt = f"System: Sei un assistente tecnico. Usa solo le informazioni fornite nei documenti seguenti.\\n\\n{context}\\n\\nDomanda: {query}\\nRisposta:"\n    return prompt\n\ndef call_ollama(prompt, max_tokens=512, temperature=0.2):\n    url = f"{OLLAMA_URL}/api/generate"\n    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "max_tokens": max_tokens, "temperature": temperature}\n    resp = requests.post(url, json=payload, timeout=60)\n    resp.raise_for_status()\n    return resp.json()\n\ndef query(q, top_k=5):\n    q_vec = embed_texts([q])[0]\n    hits = client.search(collection_name=COLLECTION, query_vector=q_vec, limit=top_k)\n    prompt = build_prompt(hits, q)\n    resp = call_ollama(prompt)\n    text = resp.get("text") or resp.get("result") or str(resp)\n    sources = [h.payload.get("source") for h in hits]\n    return {"answer": text, "sources": sources}\n\nif __name__ == "__main__":\n    parser = argparse.ArgumentParser()\n    parser.add_argument("--query", type=str, required=True)\n    args = parser.parse_args()\n    out = query(args.query)\n    print("Answer:\\n", out["answer"])\n    print("\\nSources:", out["sources"])\n```\n## docs/quickstart.md (breve guida)\n\n```Markdown\n# Quickstart\n\n1. Avvia Qdrant (docker):\n   docker run -p 6333:6333 qdrant/qdrant\n\n2. Avvia Ollama e carica un modello locale.\n\n3. Python:\n   cd python\n   pip install -r requirements.txt\n   cp .env.example .env\n   # popola python/data/raw con file .md/.txt\n   python scripts/ingest.py\n   python scripts/embed_and_index.py\n\n4. Node:\n   cp .env.example .env\n   npm install\n   npm run dev\n\n5. Prova query:\n   curl -X POST http://localhost:3000/api/ai/query -H "Content-Type: application/json" -d '{"query":"Cos\\'è RAG?"}'\n```\n## Note finali e personalizzazioni consigliate\n- **Embedding reali**: sostituisci i placeholder `embed_texts` con chiamate a modelli di embedding (transformers, microservizi, ecc.).\n- **Endpoint Ollama**: verifica la versione di Ollama e l’endpoint corretto per la generazione; alcuni setup usano `/api/generate` o endpoint diversi.\n- **Sicurezza**: aggiungi autenticazione alle server routes e non esporre il proxy pubblicamente senza protezioni.\n- **Reranking**: per migliorare precisione, aggiungi un cross-encoder per riordinare i risultati recuperati.\n- **Streaming**: se Ollama supporta streaming, implementa streaming token nel proxy per UX migliore.\n\nQuesto articolo tecnico di esempio, approfondisce su come progettare e implementare un’integrazione robusta tra Ollama e Nuxt 4 Modules; coprendo l'architettura, la sicurezza, l'orchestrazione lato server e il best practice per agenti IA e i flussi RAG illustrato nell'articolo che trovi qui.\n\n[Esecuzione di LLM in Locale con Ollama & Nuxt 4 Modules](https://devkernelpulse.org/blog/esecuzione-di-llm-in-locale-con-ollama-nuxt-4-modules)\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n	Repository di esempio di Ollama + Nuxt 4 Modules + integrazione Python con il file README e file pronti all'uso.\n	3	7	1	published	t	DKP-VAULT-CERT-ADMIN-EFTAMJ	dd7526def8b6bfcfe598f876108191c07c78023b0288150ca0609a63901c16f6	24	1	2026-10-13 05:35:17.479029	2026-10-13 05:35:17.479029	["RAG", "Ollama", "Local AI", "Python", "Agent AI", "LLM", "Nuxt 4", "Embedding"]
33	GitHub Actions: pipeline CI/CD completa per un progetto Docker	github-actions-pipeline-ci-cd-completa-per-un-progetto-docker	## Introduzione\nQuesto articolo tecnico mostra come progettare e implementare una **pipeline CI/CD completa** per un progetto containerizzato usando **GitHub Actions**. Copre l’intero flusso: build efficiente con **Docker Buildx** e caching, test automatici, scansione di sicurezza delle immagini, gestione di artifact, versioning delle immagini e deployment verso registry e ambienti di produzione (Kubernetes o ECS). Troverai esempi pratici di workflow YAML, spiegazioni dei trade‑off e best practice operative per sicurezza, performance e manutenibilità. Le raccomandazioni qui riportate si basano sulle pratiche correnti e sulle linee guida ufficiali degli strumenti citati.\n## Obiettivi della pipeline\n1. **Build riproducibile** dell’immagine Docker con caching layer-aware.\n2. **Test automatici** (unit, integration) prima del build immagine.\n3. **Scansione di sicurezza** dell’immagine (vulnerabilità note).\n4. **Versioning e tagging** coerente delle immagini (semver, commit SHA, branch).\n5. **Push sicur**o verso registry (GHCR, Docker Hub) usando OIDC o segreti.\n6. **Deployment automatizzato** su staging/production (Kubernetes/ECS).\n7. **Osservabilità**: artifact, log e notifiche su fallimenti.\n\n## Panoramica del workflow proposto\n| Stage | Azione principale | Strumenti consigliati |\n| --- | --- | --- |\n| **CI: test** | Esegui test unitari e lint | `pytest`/`jest`, linters |\n| **Build** | Build immagine con Buildx + cache | `docker/build-push-action@v4`, BuildKit |\n| **Scan** | Scansione vulnerabilità immagine | `aquasecurity/trivy-action` |\n| **Publish** | Push su registry con tag semantico | GHCR / Docker Hub, OIDC |\n| **CD: deploy** | Aggiorna deployment su k8s/ECS | `kubectl`/`aws-actions/amazon-ecs-deploy-task-definition` |\n| **Post** | Notifiche, cleanup, promozione | Slack, GitHub Releases, Canary rollout |\n\nFonti ufficiali e guide pratiche raccomandano Buildx per build multi‑platform e caching, e OIDC per evitare segreti a lungo termine.\n## Principi architetturali e best practice\n- **Separa CI e CD**: mantieni job distinti per test/build/publish e per deploy; facilita rollback e autorizzazioni.\n- **Usa Buildx + cache remota**: BuildKit + cache su registry o azioni di cache riducono tempi di build.\n- **Minimizza i layer**: Dockerfile ottimizzati (multi‑stage build, ordine delle istruzioni) migliorano cache hit rate.\n- **Autenticazione sicura**: preferisci OIDC per autenticare GitHub Actions verso cloud provider/registry; evita segreti statici.\n- **Scansione automatica**: integra Trivy o strumenti simili nel pipeline per bloccare immagini con CVE critiche.\n- Tagging coerente: usa `vX.Y.Z` per release, `branch-<name>` per branch e `sha-<short>` per build CI.\n- **Policy di promozione**: promuovi immagini da staging a prod senza rebuild (pull dal registry e deploy).\n- **Least privilege**: i job di deploy devono avere permessi limitati e approvazioni manuali per production.\n\n### Esempio: file `/.github/workflows/ci-cd.yml`\nDi seguito un workflow completo e commentato. Adattalo al tuo progetto (nome immagine, registry, comandi test).\n\n```Yaml\nname: CI/CD Docker Pipeline\n\non:\n  push:\n    branches: [ "main", "staging" ]\n  pull_request:\n    branches: [ "main" ]\n\nenv:\n  IMAGE_NAME: ghcr.io/${{ github.repository_owner }}/my-app\n  BUILD_CACHE_REPO: ghcr.io/${{ github.repository_owner }}/my-app-cache\n\npermissions:\n  contents: read\n  packages: write\n  id-token: write   # necessario per OIDC\n\njobs:\n  test:\n    name: Run tests\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Set up Python\n        uses: actions/setup-python@v4\n        with:\n          python-version: '3.10'\n      - name: Install deps\n        run: pip install -r requirements.txt\n      - name: Run unit tests\n        run: pytest -q\n      - name: Upload test results\n        if: always()\n        uses: actions/upload-artifact@v4\n        with:\n          name: test-results\n          path: tests/results || ./tests\n\n  build-and-push:\n    name: Build, scan and push image\n    needs: test\n    runs-on: ubuntu-latest\n    environment:\n      name: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}\n    steps:\n      - uses: actions/checkout@v4\n\n      - name: Set up QEMU\n        uses: docker/setup-qemu-action@v2\n\n      - name: Set up Docker Buildx\n        uses: docker/setup-buildx-action@v2\n\n      - name: Login to registry via OIDC (GHCR example)\n        uses: docker/login-action@v2\n        with:\n          registry: ghcr.io\n          oidc: true\n\n      - name: Restore build cache\n        uses: actions/cache@v4\n        with:\n          path: /tmp/.buildx-cache\n          key: buildx-cache-${{ github.sha }}\n          restore-keys: |\n            buildx-cache-\n\n      - name: Build and push\n        uses: docker/build-push-action@v4\n        with:\n          context: .\n          file: ./Dockerfile\n          push: true\n          tags: |\n            ${{ env.IMAGE_NAME }}:sha-${{ github.sha }}\n            ${{ env.IMAGE_NAME }}:${{ github.ref_name == 'main' && 'latest' || github.ref_name }}\n          cache-from: type=registry,ref=${{ env.BUILD_CACHE_REPO }}:cache\n          cache-to: type=registry,ref=${{ env.BUILD_CACHE_REPO }}:cache,mode=max\n\n      - name: Scan image with Trivy\n        uses: aquasecurity/trivy-action@v1\n        with:\n          image-ref: ${{ env.IMAGE_NAME }}:sha-${{ github.sha }}\n          format: 'table'\n          exit-code: '1'   # fallisce il job se vulnerabilità critiche trovate\n\n      - name: Create release tag (on main)\n        if: github.ref == 'refs/heads/main'\n        run: |\n          VERSION="v$(date +'%Y.%m.%d')-${GITHUB_RUN_NUMBER}"\n          gh release create $VERSION -t "Release $VERSION" -n "Automated release"\n```\n## Spiegazioni chiave:\n- `id-token: write` + `docker/login-action` con oidc: true permette login senza segreti permanenti.\n- `docker/build-push-action` con `cache-from`/`cache-to` sfrutta registry come cache remoto per BuildKit.\n- Trivy integrato blocca push di immagini con vulnerabilità critiche.\n\n## Deployment: Kubernetes (esempio con `kubectl`)\nAggiungi un job separato per il deploy che viene eseguito solo su main e richiede approvazione manuale per production.\n\n```Yaml\ndeploy:\n    name: Deploy to Kubernetes\n    needs: build-and-push\n    runs-on: ubuntu-latest\n    if: github.ref == 'refs/heads/main'\n    environment:\n      name: production\n      url: https://my-app.example.com\n    steps:\n      - uses: actions/checkout@v4\n\n      - name: Configure kubectl\n        uses: azure/setup-kubectl@v3\n        with:\n          version: '1.27.0'\n\n      - name: Authenticate to cluster (OIDC or kubeconfig secret)\n        run: |\n          echo "${{ secrets.KUBE_CONFIG_DATA }}" | base64 --decode > kubeconfig\n          export KUBECONFIG=$PWD/kubeconfig\n\n      - name: Update deployment image\n        run: |\n          kubectl set image deployment/my-app my-app=${{ env.IMAGE_NAME }}:sha-${{ github.sha }} --record\n          kubectl rollout status deployment/my-app --timeout=120s\n```\n**Note:**\n- Preferisci OIDC or short‑lived kubeconfig tokens; se usi `secrets.KUBE_CONFIG_DATA`, assicurati che il segreto sia gestito con policy di rotazione.\n- Per rollout avanzati usa canary/blue‑green con strumenti come Argo Rollouts o Flagger.\n\n## Deployment: AWS ECS (esempio)\nPer ECS, aggiorna la task definition e usa l’action ufficiale:\n\n```Yaml\n- name: Configure AWS credentials\n        uses: aws-actions/configure-aws-credentials@v2\n        with:\n          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}\n          aws-region: us-east-1\n\n      - name: Deploy to ECS\n        uses: aws-actions/amazon-ecs-deploy-task-definition@v1\n        with:\n          task-definition: ecs/task-def.json\n          service: my-service\n          cluster: my-cluster\n          wait-for-service-stability: true\n```\nUsa IAM roles con permessi minimi e OIDC where possible per evitare long‑lived credentials.\n## Gestione dei segreti e sicurezza\n- **OIDC**: abilita OIDC per autenticare Actions verso cloud provider/registry senza segreti permanenti.\n- **Secrets scoping**: limita l’accesso ai secrets per repository/environment.\n- **Secret scanning**: attiva GitHub secret scanning e prevenzione push di segreti.\n- **Least privilege**: i token usati per deploy devono avere solo le azioni necessarie.\n- **Audit e logging**: registra eventi di deploy e accessi per compliance.\n\n## Metriche, monitoraggio e rollback\n- **Metriche**: monitora tempi di build, cache hit rate, tempo di deploy e success rate dei job.\n- **Alerting**: integra notifiche (Slack, Teams) per job falliti o rollback.\n- **Rollback**: mantieni immagine precedente e script di rollback; usa `kubectl rollout undo` o ECS task rollback.\n- **Canary/Progressive rollout**: per ridurre rischi, usa strategie progressive e feature flags.\n\n## Ottimizzazioni avanzate\n- **Layer caching fine‑grained**: separa dipendenze e codice applicativo in Dockerfile per massimizzare cache reuse.\n- **Multi‑arch build**: Buildx supporta platforms: `linux/amd64,linux/arm64`.\n- **Parallel jobs**: esegui lint/test/static analysis in parallelo per velocizzare CI.\n- **Rerun only changed services**: in mono‑repo, determina quali servizi sono cambiati e builda solo quelli.\n- **Immutable artifacts**: usa digest (`sha256`) per deploy immutabili.\n\n## Checklist rapida per l’adozione\n1. **Dockerfile**: ottimizzato per cache e multi‑stage.\n2. **Buildx**: abilitato con cache remota.\n3. **Test**: pipeline CI esegue test prima del build immagine.\n4. **Scan**: integrazione Trivy o simili.\n5. **Auth**: OIDC per registry/cloud provider.\n6. **Tagging**: strategia di tag coerente e promozione tra ambienti.\n7. **Deploy**: job separati per staging e production con approvazioni.\n8. **Monitoring**: metriche e notifiche attive.\n9. **Policy**: least privilege e secret rotation.\n\n## Risorse e letture consigliate\n- Documentazione ufficiale Docker Buildx e caching per GitHub Actions.\n- Linee guida GitHub Actions su sicurezza e OIDC.\n- Guide su scansione immagini con Trivy e integrazione in CI.\n## Conclusione\nUna pipeline CI/CD robusta per progetti Docker con GitHub Actions richiede attenzione a **efficienza** (build cache, Buildx), **sicurezza** (OIDC, scansione immagini, least privilege) e **operational maturity** (monitoring, rollback, promozione immagine). Il modello proposto è modulare: puoi adottare singoli componenti (es. solo build cache o solo Trivy) e poi estendere verso deployment automatizzati e strategie di rollout avanzate.\n	Pipeline CI/CD completa per immagini Docker: build ottimizzato, caching, test, scansione di sicurezza, artifact e deployment automatizzato su registry e cluster.	5	179	1	published	t	DKP-VAULT-CERT-ADMIN-S4NEFW	f5b4aa502b389c07aa664ab400a8e843e3f18aa4fc17fb7dd61b96424f118cc3	24	1	2026-10-13 07:03:21.329965	2026-10-13 13:54:44.258	["GitHub Actions", "CI/CD", "Docker", "Buildx", "Caching", "Security", "Trivy", "Kubernetes", "ECS", "Container Registry", "AWS ECS", "Python/Node", "Make"]
29	Repository di esempio: RAG locale con Ollama e Qdrant con README completo	repository-di-esempio-rag-locale-con-ollama-e-qdrant-con-readme-completo	## Repository di esempio: RAG locale con Ollama e Qdrant con file README completo\n\nDi seguito trovi un repository di esempio pronto all’uso che implementa una pipeline end‑to‑end per un sistema RAG locale: **ingest**, **chunking**, **embedding**, **indexing** su **Qdrant** e **query** con generazione tramite **Ollama**. Il codice è scritto in **Python** e organizzato per essere facilmente adattabile a dataset reali e a modelli di embedding locali o remoti.\n\n> Nota: gli endpoint e i nomi dei modelli di Ollama possono variare in base alla tua installazione. Adatta `OLLAMA_URL` e `OLLAMA_MODEL` nel file di configurazione. Assicurati che Qdrant sia in esecuzione (es. Docker) e che Ollama sia installato e configurato localmente.\n\n### Struttura del repository\n```Codice\nrag-local-ollama-qdrant/\n├─ README.md\n├─ pyproject.toml\n├─ requirements.txt\n├─ .env.example\n├─ scripts/\n│  ├─ ingest.py\n│  ├─ embed_and_index.py\n│  ├─ query.py\n│  └─ utils.py\n├─ data/\n│  ├─ raw/                # documenti originali (pdf, md, txt)\n│  └─ processed/          # chunk testuali generati\n└─ notebooks/\n   └─ demo.ipynb\n```\n\n```Markdown\n# RAG Locale con Ollama & Qdrant — Esempio Python\n\n**Descrizione**  \nRepository di esempio che mostra come costruire una pipeline RAG locale usando Ollama per l'inferenza LLM e Qdrant come vector database. Include script per ingest, chunking, calcolo embedding, indexing e query.\n\n**Stack**\n- Python 3.10+\n- Qdrant (docker o servizio locale)\n- Ollama (runtime LLM locale)\n- Librerie Python: qdrant-client, requests, numpy, python-dotenv\n---\n\n## Requisiti\n\n1. Docker (per Qdrant) o installazione locale di Qdrant.\n2. Ollama installato e configurato localmente.\n3. Python 3.10+ e pip.\n\nInstallazione dipendenze:\n``bash\npip install -r requirements.txt\n```\n\n**Esempio** `requirements`.txt:\n\n```Codice\nqdrant-client==1.9.0\nnumpy\nrequests\npython-dotenv\ntqdm\nsentencepiece\n```\n**Copia** `.env.example` in `.env` e modifica le variabili:\n\n```Codice\nQDRANT_URL=http://localhost:6333\nQDRANT_API_KEY=\nQDRANT_COLLECTION=docs\nVECTOR_DIM=768\nOLLAMA_URL=http://localhost:11434\nOLLAMA_MODEL=your-ollama-model\nEMBEDDING_MODEL=local-embedding-model-or-api\nCHUNK_SIZE=800\nCHUNK_OVERLAP=100\n```\n## Flusso di lavoro\n1. **Ingest**: posiziona i documenti in `data/raw/` e lancia `scripts/ingest.py` per estrarre testo e creare chunk.\n2. **Embedding & Indexing**: esegui `scripts/embed_and_index.py` per calcolare embedding dei chunk e upsertare i vettori in Qdrant.\n3. **Query**: usa `scripts/query.py` per inviare query, recuperare top-k chunk e generare la risposta con Ollama.\n\n## Script principali\n\n### scripts/utils.py\nContiene funzioni di utilità: lettura file, chunking, normalizzazione testo.\n\n### scripts/ingest.py\n- Scansiona `data/raw/`\n- Estrae testo (supporto base per .txt e .md; estendibile a PDF con librerie come `pdfminer.six` o `pypdf`)\n- Chunking con sliding window\n- Salva chunk in `data/processed/` come JSONL\n\n### scripts/embed_and_index.py\n- Legge `data/processed/*.jsonl`\n- Calcola embedding (funzione `embed_texts` da adattare al tuo modello)\n- Crea/ricrea collection Qdrant\n- Upserta punti con payload `{ "text": ..., "source": ..., "chunk_id": ... }`\n\n### scripts/query.py\n- Riceve query da CLI o input\n- Calcola embedding della query\n- Cerca top-k in Qdrant\n- Costruisce prompt con i chunk recuperati\n- Chiama Ollama per generare la risposta\n- Stampa risposta e riferimenti alle fonti\n\n## Esempi d'uso\n1. Ingest:\n\n```Bash\npython scripts/ingest.py\n```\n2. Embedding & Index:\n```Bash\npython scripts/embed_and_index.py\n```\n3. Query:\n```Bash\npython scripts/query.py --query "Cos'è la Retrieval-Augmented Generation?"\n```\n\n## Estensioni e miglioramenti consigliati\n- Supporto PDF/HTML avanzato (pypdf, beautifulsoup).\n- Embedding locali con modelli quantizzati (per CPU) o GPU.\n- Reranking con cross-encoder per migliorare precisione.\n- Pipeline di aggiornamento incrementale (upsert + delete).\n- Interfaccia web (FastAPI / Streamlit / Nuxt) con endpoint server-side che chiamano Ollama.\n\n## Licenza\n\n### MIT\n\n```Codice\n---\n\n## Script Python: implementazione essenziale\n\n> I seguenti script sono **scheletri funzionali** pronti per essere copiati nel repository. Adatta la funzione `embed_texts` al tuo modello di embedding (locale o API).\n\n### `scripts/utils.py`\n``python\nimport os\nimport json\nfrom pathlib import Path\n\ndef read_text_file(path: str) -> str:\n    with open(path, "r", encoding="utf-8") as f:\n        return f.read()\n\ndef save_jsonl(items, out_path):\n    with open(out_path, "w", encoding="utf-8") as f:\n        for it in items:\nf.write(json.dumps(it, ensure_ascii=False) + "\\n")\n\ndef chunk_text(text, chunk_size=800, overlap=100):\n    tokens = text.split()\n    chunks = []\n    i = 0\n    idx = 0\n    while i < len(tokens):\n        chunk = " ".join(tokens[i:i+chunk_size])\n        chunks.append({"chunk_id": idx, "text": chunk})\n        idx += 1\n        i += chunk_size - overlap\n    return chunks\n```\n\n`scripts/ingest.py`\n```python\nimport os\nimport json\nfrom pathlib import Path\nfrom scripts.utils import read_text_file, chunk_text, save_jsonl\n\nRAW_DIR = Path("data/raw")\nPROC_DIR = Path("data/processed")\nPROC_DIR.mkdir(parents=True, exist_ok=True)\n\ndef ingest():\n    all_chunks = []\n    for file in RAW_DIR.iterdir():\n        if file.suffix.lower() not in [".txt", ".md"]:\n            continue\n        text = read_text_file(file)\n        chunks = chunk_text(text, chunk_size=int(os.getenv("CHUNK_SIZE", 800)), overlap=int(os.getenv("CHUNK_OVERLAP", 100)))\n        for c in chunks:\nall_chunks.append({\n                "source": str(file.name),\n                "chunk_id": c["chunk_id"],\n                "text": c["text"]\n            })\n    out_path = PROC_DIR / "chunks.jsonl"\n    save_jsonl(all_chunks, out_path)\n    print(f"Saved {len(all_chunks)} chunks to {out_path}")\n\nif __name__ == "__main__":\n    ingest()\n```\n\n`scripts/embed_and_index.py`\n```python\nimport os\nimport json\nfrom qdrant_client import QdrantClient\nfrom qdrant_client.http import models as rest\nimport numpy as np\nfrom pathlib import Path\nfrom scripts.utils import save_jsonl\n\nPROC_DIR = Path("data/processed")\nCHUNKS_FILE = PROC_DIR / "chunks.jsonl"\n\nQDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")\nCOLLECTION = os.getenv("QDRANT_COLLECTION", "docs")\nVECTOR_DIM = int(os.getenv("VECTOR_DIM", 768))\n\nclient = QdrantClient(url=QDRANT_URL)\n\ndef embed_texts(texts):\n    """\n    Implementa qui la chiamata al tuo modello di embedding.\n    Restituisci una numpy array shape (n_texts, VECTOR_DIM).\n    """\n# Placeholder: vettori casuali (sostituire con embedding reali)\n    return np.random.rand(len(texts), VECTOR_DIM).astype(np.float32)\n\ndef load_chunks():\n    chunks = []\n    with open(CHUNKS_FILE, "r", encoding="utf-8") as f:\n        for line in f:\n            chunks.append(json.loads(line))\n    return chunks\n\ndef create_collection():\n    # Ricrea la collection (cancella se esiste)\n    try:\n        client.delete_collection(collection_name=COLLECTION)\n    except Exception:\n        pass\n    client.recreate_collection(\n        collection_name=COLLECTION,\n        vectors_config=rest.VectorParams(size=VECTOR_DIM, distance=rest.Distance.COSINE)\n    )\ndef upsert_chunks(chunks, vectors):\n    points = []\n    for idx, (chunk, vec) in enumerate(zip(chunks, vectors)):\n        points.append({\n            "id": idx,\n            "vector": vec.tolist(),\n            "payload": {"text": chunk["text"], "source": chunk["source"], "chunk_id": chunk["chunk_id"]}\n        })\n    client.upsert(collection_name=COLLECTION, points=points)\n    print(f"Upserted {len(points)} points to Qdrant collection '{COLLECTION}'")\n\ndef main():\n    chunks = load_chunks()\n    texts = [c["text"] for c in chunks]\n    vectors = embed_texts(texts)\n    create_collection()\n    upsert_chunks(chunks, vectors)\n\nif __name__ == "__main__":\n    main()\n```\n\n`scripts/query.py`\n```Python\nimport os\nimport json\nimport argparse\nimport numpy as np\nimport requests\nfrom qdrant_client import QdrantClient\nfrom pathlib import Path\n\nQDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")\nCOLLECTION = os.getenv("QDRANT_COLLECTION", "docs")\nOLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")\nOLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "your-ollama-model")\nVECTOR_DIM = int(os.getenv("VECTOR_DIM", 768))\n\nclient = QdrantClient(url=QDRANT_URL)\n\ndef embed_texts(texts):\n    """\n    Implementa qui la chiamata al tuo modello di embedding per la query.\n    """\n    # Placeholder: vettore casuale\n    return np.random.rand(len(texts), VECTOR_DIM).astype(np.float32)\n\ndef build_prompt(chunks, query):\ncontext = "\\n\\n".join([f"[{i}] {c['payload']['text']} (source: {c['payload']['source']})" for i,c in enumerate(chunks)])\n    prompt = f"System: Sei un assistente tecnico. Usa solo le informazioni fornite nei documenti seguenti.\\n\\n{context}\\n\\nDomanda: {query}\\nRisposta:"\n    return prompt\n\ndef call_ollama(prompt, max_tokens=512, temperature=0.2):\n    url = f"{OLLAMA_URL}/api/generate"\n    payload = {"model": OLLAMA_MODEL, "prompt": prompt, "max_tokens": max_tokens, "temperature": temperature}\n    resp = requests.post(url, json=payload, timeout=60)\n    resp.raise_for_status()\n    return resp.json()\n\ndef query(q, top_k=5):\n    q_vec = embed_texts([q])[0]\n    hits = client.search(collection_name=COLLECTION, query_vector=q_vec, limit=top_k)\n    prompt = build_prompt(hits, q)\n    resp = call_ollama(prompt)\n    # adattare in base alla struttura della risposta di Ollama\n    text = resp.get("text") or resp.get("result") or str(resp)\n    sources = [h.payload.get("source") for h in hits]\n    return {"answer": text, "sources": sources}\n\nif __name__ == "__main__":\n    parser = argparse.ArgumentParser()\n    parser.add_argument("--query", type=str, required=True)\n    args = parser.parse_args()\n    out = query(args.query)\n    print("Answer:\\n", out["answer"])\n    print("\\nSources:", out["sources"])\n```\n\n## Note operative e adattamenti\n- **Embedding reali**: sostituisci le funzioni placeholder embed_texts con chiamate al tuo modello di embedding (es. modello locale con `transformers`, API di un servizio di embedding, o un microservizio Python che espone embeddings).\n- **Ollama API**: verifica l’endpoint e il formato di richiesta/risposta della tua versione di Ollama; alcuni setup usano endpoint diversi o supportano streaming.\n- **PDF**: per PDF usa `pypdf` o `pdfminer.six` per estrarre testo; per HTML usa `beautifulsoup4`.\n- **Normalizzazione**: applica pulizia testo, rimozione di boilerplate, normalizzazione Unicode prima del chunking.\n- **Dimensione vettore**: imposta `VECTOR_DIM` in `.env` in base al modello di embedding usato.\n- **Sicurezza**: non esporre direttamente Ollama al client; usa sempre endpoint server-side protetti.\n\n## Notebook demo\n\nNel notebook `notebooks/demo.ipynb` includi:\n- Esempio di ingest di un documento di esempio.\n- Calcolo embedding per pochi chunk.\n- Upsert su Qdrant.\n- Query interattiva e chiamata a Ollama.\n- Visualizzazione dei risultati e delle fonti.\n\n## Conclusione\n\nQuesto repository fornisce una base solida per sperimentare un sistema RAG locale con Ollama e Qdrant. Puoi estendere gli script per supportare pipeline più complesse (reranking, hybrid search, aggiornamenti incrementali) e integrare una UI (FastAPI, Streamlit, Nuxt) che chiami gli endpoint server‑side.\n\n[Costruire un sistema RAG locale con Ollama e Qdrant](https://devkernelpulse.org/blog/costruire-un-sistema-rag-locale-con-ollama-e-qdrant)\n\n	Di seguito trovi un repository di esempio pronto all’uso che implementa una pipeline end‑to‑end per un sistema RAG locale.	3	78	1	published	t	DKP-VAULT-CERT-ADMIN-YWD9MM	7fe92659fc378c1012652bd12d8662f5d417318cd06f9352f27aa707e512a7ff	5	1	2026-10-13 04:33:55.247139	2026-10-13 04:33:55.247139	["RAG", "Ollama", "Qdrant", "Local AI", "Python", "Vector Database", "Embeddings", "LLM", "pipeline end-to-end"]
37	Scrivere un tool CLI di sistema in Rust	scrivere-un-tool-cli-di-sistema-in-rust	## Introduzione\n\nCostruire un tool CLI di sistema in Rust significa combinare **affidabilità a basso livello**, **sicurezza della memoria** e **esperienza utente da riga di comando**. Rust è particolarmente adatto per questo dominio grazie al controllo fine sulle risorse, al modello di proprietà e all’ecosistema maturo per CLI (es. `clap`) e per l’interazione con il sistema operativo (`nix`, `libc`). Questo articolo guida passo‑passo dalla progettazione all’implementazione, fino a testing, packaging e distribuzione, con esempi pratici e pattern consolidati.\n\n## 1. Requisiti e progettazione iniziale\n\n### Obiettivi funzionali\n- **Cosa** deve fare il tool (es. gestione processi, monitoraggio, manipolazione file di sistema, network utility).\n- **Chi** lo userà (root, amministratori, utenti non privilegiati).\n- **Vincoli**: performance, latenza, compatibilità OS, requisiti di sicurezza.\n\n### Requisiti non funzionali\n- **Sicurezza**: minimizzare privilegi, evitare escalation non necessarie.\n- **Affidabilità**: gestione robusta degli errori, logging strutturato.\n- **Portabilità**: target Linux (systemd), macOS, o anche BSD.\n- **Interoperabilità**: output machine‑readable (JSON) oltre a human‑friendly.\n\n### Architettura consigliata\n- **Core library** (`lib`) con logica testabile.\n- **Binary** (`bin`) che espone CLI e parsing degli argomenti.\n- **Moduli**: `cli`, `sys` (syscalls), `io`, `policy` (permessi), `daemon` (se necessario).\n- **Separation of concerns**: logica di dominio separata da parsing e I/O.\n\n## 2. Scelta delle crate e toolchain\n- **Argument parsing**: `clap` (v4) o `structopt` (deprecated in favore di clap derive).\n- **Async**: `tokio` o `async-std` solo se serve I/O concorrente; preferire sync per semplicità se non necessario.\n- **System calls / POSIX**: `nix` crate per wrapper sicuri; `libc` per chiamate non coperte.\n- **Logging**: `tracing` + `tracing-subscriber` per logging strutturato e livelli.\n- **Config**: `config` o `serde` + `toml/yaml` per file di configurazione.\n- **Serialization**: `serde_json` per output JSON.\n- **Testing**: `assert_cmd`, `predicates`, `tempfile` per test CLI end‑to‑end.\n- **Packaging**: `cargo-deb`, `cargo-rpm`, `cross` per cross‑compilation.\n- **Security**: `seccomp` bindings o wrapper (se necessario) per sandboxing.\n\n## 3. Struttura del progetto (esempio)\n\n```Codice\nmytool/\n├─ Cargo.toml\n├─ src/\n│  ├─ lib.rs        # core logic, testable\n│  ├─ main.rs       # CLI entrypoint\n│  ├─ cli.rs        # clap definitions\n│  ├─ sys.rs        # wrappers nix/libc\n│  └─ daemon.rs     # optional daemonization\n├─ tests/\n│  └─ integration.rs\n├─ scripts/\n│  └─ build-deb.sh\n└─ .github/workflows/ci.yml\n```\n## 4. CLI design: ergonomia e UX\n- **Subcommands**: preferire subcommands (`mytool status`, `mytool config set`) per chiarezza.\n- **Output duale**: `--json` per machine, default human‑readable.\n- **Exit codes**: definire codici coerenti (0 success, 1 generic error, >1 per errori specifici).\n- **Help e man page**: generare `man` con `help2man` o `ronn`; includere esempi d’uso.\n- **Autocompletion**: generare script per bash/zsh/fish con `clap_complete`.\n\nEsempio `clap` (derive):\n\n```Rust\nuse clap::{Parser, Subcommand};\n\n#[derive(Parser)]\n#[command(name = "mytool", about = "System utility")]\nstruct Cli {\n    #[command(subcommand)]\n    cmd: Commands,\n}\n\n#[derive(Subcommand)]\nenum Commands {\n    Status,\n    Restart { service: String },\n    Config { key: String, value: String },\n}\n```\n## 5. Interazione con il sistema operativo\n\n### Uso di `nix` e `libc`\n- `nix` fornisce wrapper sicuri per file descriptor, fork/exec, signals, mount, etc.\n- Per chiamate non coperte, usare `libc` con `unsafe` limitato e ben isolato.\nEsempi pratici:\n- **Gestione processi**: `nix::unistd::fork`, `nix::sys::wait::waitpid`, `nix::unistd::execv`.\n- **Permessi**: `nix::unistd::setuid`, `setgid` per drop privileges.\n- **Signals**: `signal_hook` crate per gestione robusta di SIGINT/SIGTERM.\n\n### Privilegi e sicurezza\n- **Principio of least privilege**: eseguire come utente non privilegiato quando possibile; usare capability (Linux capabilities) invece di root completo.\n- **Drop privileges**: aprire risorse che richiedono privilegi, poi `setuid`/`setgid` a user meno privilegiato.\n- **File permissions**: creare file con `umask` e permessi restrittivi; usare `O_CLOEXEC` per FD.\n- **Secure temp files**: usare `tempfile` crate per evitare TOCTOU.\n\n## 6. Concorrenza e I/O\n- **Sync vs Async**: preferire sync per semplicità e prevedibilità; usare `tokio` per networking ad alta concorrenza.\n- **Threading**: `std::thread` o `rayon` per parallelismo CPU‑bound.\n- **Non‑blocking I/O**: per socket/epoll usare `mio` o `tokio` se necessario.\n- **File locking**: `fs2` o `fcntl` per lock advisory su file condivisi.\n\n## 7. Error handling e resilienza\n- **Error types**: definire errori applicativi con `thiserror` e propagare con `anyhow` in bin.\n- **Context**: usare `.context()` per messaggi utili al debug.\n- **Retries**: politiche di retry esponenziali per operazioni I/O instabili.\n- **Timeouts**: evitare blocchi indefiniti; usare `std::time::Duration` e `select`/`tokio::time::timeout`.\n\nEsempio:\n\n```Rust\nuse thiserror::Error;\n\n#[derive(Error, Debug)]\npub enum MyError {\n    #[error("IO error: {0}")]\n    Io(#[from] std::io::Error),\n    #[error("Permission denied")]\n    Permission,\n}\n```\n## 8. Testing: unit, integration e system tests\n- **Unit tests**: logica in `lib.rs` testabile con `cargo test`.\n- **Integration tests**: `tests`/ con `assert_cmd` per eseguire il binario e verificare output/exit codes.\n- **System tests**: usare container (Docker) o VM per testare interazioni reali con il sistema (es. systemd, network).\n- **Fuzzing**: `cargo-fuzz` per input parsing e gestione errori.\n- **CI**: pipeline che esegue test su più target e cross‑compile.\n\nEsempio `assert_cmd`:\n\n```Rust\nuse assert_cmd::Command;\n\n#[test]\nfn test_status() {\n    let mut cmd = Command::cargo_bin("mytool").unwrap();\n    cmd.arg("status").assert().success().stdout(predicates::str::contains("OK"));\n}\n```\n## 9. Logging, observability e metriche\n- **Logging**: `tracing` con livelli configurabili; output JSON per sistemi di log centralizzati.\n- **Metrics**: esporre endpoint Prometheus con `prometheus` crate o `opentelemetry` per tracing distribuito.\n- **Health checks**: endpoint o file lock per orchestratori (systemd, k8s readiness probe).\n- **Structured errors**: includere error codes e context per facilità di analisi.\n\n## 10. Daemonizzazione e integrazione con systemd\n- **Preferire systemd**: non reinventare daemonization; fornire unit file systemd e lasciare che systemd gestisca restart, logging e cgroups.\n- **Unit file esempio**:\n- \n```Ini\n[Unit]\nDescription=MyTool system service\nAfter=network.target\n\n[Service]\nType=simple\nExecStart=/usr/bin/mytool daemon\nUser=mytool\nGroup=mytool\nRestart=on-failure\nLimitNOFILE=65536\n\n[Install]\nWantedBy=multi-user.target\n```\n- **Socket activation**: supportare socket activation se utile (systemd socket).\n\n## 11. Packaging e distribuzione\n- **Binaries**: build con `cargo build --release`.\n- **Cross compilation**: usare `cross` o toolchain rustup target + `musl` for static linking.\n- **Deb/RPM**: `cargo-deb`, `cargo-rpm` per pacchetti nativi; includere unit file e postinst scripts.\n- **Homebrew / Scoop**: formulae per macOS/Windows users.\n- **Container images**: multi‑stage Dockerfile per immagini minime (scratch or distroless).\n- **Signing**: firmare pacchetti e release (GPG) per integrità.\n\nEsempio Dockerfile minimale:\n\n```dockerfile\nFROM rust:1.XX as builder\nWORKDIR /app\nCOPY . .\nRUN cargo build --release\n\nFROM debian:bookworm-slim\nCOPY --from=builder /app/target/release/mytool /usr/local/bin/mytool\nENTRYPOINT ["/usr/local/bin/mytool"]\n```\n## 12. Sicurezza avanzata\n- **Code audit**: review di unsafe blocks e dipendenze native.\n- **Minimizzare unsafe**: isolare `unsafe` in moduli piccoli e ben testati.\n- **Dependency scanning**: `cargo audit` in CI (GitHub Actions).\n- **Sandboxing**: usare seccomp, namespaces, o eseguire operazioni rischiose in processi separati con capability ridotte.\n- **Memory safety**: sfruttare ownership e borrow checker; usare `miri` per bug difficili.\n\n## 13. Esempio pratico: comando status che legge /proc e restituisce JSON\n\n**lib.rs (semplificato):**\n\n```Rust\nuse serde::Serialize;\nuse std::fs;\n\n#[derive(Serialize)]\npub struct Status {\n    uptime: u64,\n    loadavg: [f64; 3],\n}\n\npub fn system_status() -> Result<Status, std::io::Error> {\n    let uptime = fs::read_to_string("/proc/uptime")?\n        .split_whitespace()\n        .next()\n        .and_then(|s| s.parse::<f64>().ok())\n        .map(|v| v as u64)\n        .unwrap_or(0);\n    let load = fs::read_to_string("/proc/loadavg")?;\n    let parts: Vec<&str> = load.split_whitespace().collect();\n    let loadavg = [\n        parts.get(0).and_then(|s| s.parse().ok()).unwrap_or(0.0),\n        parts.get(1).and_then(|s| s.parse().ok()).unwrap_or(0.0),\n        parts.get(2).and_then(|s| s.parse().ok()).unwrap_or(0.0),\n    ];\n    Ok(Status { uptime, loadavg })\n}\n```\n**main.rs (CLI):**\n\n```Rust\nuse clap::Parser;\nuse mytool::system_status;\nuse serde_json::to_string_pretty;\n\n#[derive(Parser)]\nstruct Cli { #[arg(long)] json: bool }\n\nfn main() {\n    let cli = Cli::parse();\n    match system_status() {\n        Ok(s) => {\n            if cli.json {\n                println!("{}", to_string_pretty(&s).unwrap());\n            } else {\n                println!("Uptime: {}s", s.uptime);\n                println!("Loadavg: {:.2} {:.2} {:.2}", s.loadavg[0], s.loadavg[1], s.loadavg[2]);\n            }\n        }\n        Err(e) => {\n            eprintln!("Error: {}", e);\n            std::process::exit(1);\n        }\n    }\n}\n```\n## 14. CI/CD e quality gates\n- **CI**: lint (`cargo fmt`, `clippy`), unit tests, integration tests, `cargo audit`.\n- **Cross‑build**: build artifacts for supported targets; attach to releases.\n- **Releases**: GitHub Releases con assets per piattaforma e checksum.\n- **Signed releases**: GPG sign binaries or packages.\n\nEsempio GitHub Actions steps:\n- checkout, setup rust, cache cargo, `run cargo fmt -- --check`, `cargo clippy -- -D warnings`, `cargo test`, `cargo build --release`, `cargo audit`.\n\n## 15. Conclusione e passi successivi\n\nScrivere un tool CLI di sistema in Rust richiede attenzione a **design modulare**, **gestione sicura dei privilegi**, **interazione corretta con il kernel** e **processi di testing e packaging** solidi. Seguendo i pattern qui descritti — separazione tra core e CLI, uso di crate sicure (`nix`, `tracing`), test end‑to‑end e packaging nativo — otterrai un tool robusto, sicuro e manutenibile.\n\n\n\n\n\n\n	Guida tecnica e approfondita per progettare, implementare e distribuire un tool CLI di sistema in Rust: architettura, gestione permessi, interazione con il kernel, testing e distribuzione.	10	142	1	published	t	DKP-VAULT-CERT-ADMIN-3EAFK8	f3e9dd3ac6f62c30fa6258ad59bfb8cff2dc38ba1c3d1ad61b45f31b1d301dc6	7	1	2026-10-16 05:04:21.88715	2026-10-16 05:04:21.88715	["Rust", "CLI", "Systems Programming", "Kernel Interfaces", "Permissions", "Cross Compilation", "Packaging", "Testing", "Cargo", "deb/rpm packaging", "cross‑compilation toolchain", "Docker", "CI", "GitHub Actions"]
28	Esecuzione di LLM in Locale con Ollama & Nuxt 4 Modules	esecuzione-di-llm-in-locale-con-ollama-nuxt-4-modules	## Introduzione\n\nEseguire modelli di linguaggio (LLM) in locale è diventato praticabile grazie a runtime e tool che permettono inferenza on‑premise, riducendo latenza e rischi legati alla privacy. **Ollama** è uno di questi runtime che facilita il deployment di modelli locali; **Nuxt 4** (con i suoi moduli) offre un ottimo punto di integrazione per applicazioni web moderne. Questo articolo tecnico approfondisce come progettare e implementare un’integrazione robusta tra Ollama e Nuxt 4 Modules, coprendo architettura, sicurezza, orchestrazione lato server e best practice per agenti IA e flussi RAG.\n\n## Panoramica architetturale\n\n| Componente | Ruolo |\n| --- | --- |\n| **Ollama (runtime LLM locale)** | Esecuzione dei modelli, API locale per inferenza, gestione modelli. |\n| **Nuxt 4 (server + moduli)** | Interfaccia web, API server-side (server routes), orchestrazione chiamate a Ollama, autenticazione. |\n| **Embeddings / Vector DB (opzionale)** | Qdrant/Weaviate per retrieval in architetture RAG. |\n| **Agent layer** | Logica di orchestrazione: retrieval → prompt building → generation → post-processing. |\n| **Storage** | Document store per sorgenti (file, DB), cache delle risposte, logging. |\n\n\n**Pattern consigliato**: mantenere tutte le chiamate a Ollama sul lato server (Nuxt server routes / server API) per evitare esposizione diretta dell’endpoint locale al client.\n\n## Requisiti e setup iniziale\n- **Ambiente di sviluppo**: macchina con risorse adeguate (CPU o GPU a seconda del modello), Node.js 18+, Python 3.10+ se si usano componenti Python per embedding o pipeline.\n- **Installazioni**:\n- - Ollama installato e configurato localmente (modelli scaricati e testati).\n- - Nuxt 4 project (`nuxi init`) con supporto per server‑side modules.\n- - (Opzionale) Vector DB come Qdrant per RAG.\n- **Pacchetti utili**:\n- - **Lato Node**: `ohmyfetch`/`axios` per chiamate HTTP, `@nuxtjs`/ moduli per autenticazione, caching.\n- - Lato Python (se usato per embedding): `qdrant-client`, `numpy`, `requests`.\n\n## Architettura di integrazione: principi chiave\n1. **Server‑side only**: tutte le richieste a Ollama devono transitare da endpoint server (server routes o server middleware) per controllo accessi e rate limiting.\n2. **Prompt engineering modulare**: separare template di system prompt, retrieval context e user prompt; versionare i template.\n3. **Contesto e token budget**: limitare la dimensione del contesto inviato al modello; usare chunking e selezione top‑k.\n4. **Sicurezza**: autenticazione JWT/Session, CORS restrittivo, rate limiting e logging delle richieste.\n5. **Resilienza**: circuit breaker e fallback (es. risposte cached) se Ollama non risponde.\n\n## Flusso operativo (end‑to‑end)\n1. **Client** invia query a Nuxt server route (`/api/ai/query`).\n2. **Server** valida autenticazione e quota, normalizza la query.\n3. **Retrieval** (opzionale): server interroga vector DB per top‑k chunk rilevanti.\n4. **Prompt composition**: costruzione del prompt con system instructions + retrieved context + user query.\n5. **Call a Ollama**: POST verso l’API locale di Ollama; gestione streaming se supportato.\n6. **Post‑processing**: estrazione citazioni, verifica di coerenza, redazione della risposta.\n7. **Risposta**: server restituisce al client la risposta strutturata (testo, riferimenti, confidence).\n\n## Implementazione pratica con Nuxt 4 Modules\n### 1) Struttura del progetto (sintesi)\n\n```Codice\n/my-nuxt-app\n  /server\n    /api\n      ai\n        query.post.ts\n  /modules\n    ollama-module/\n      index.ts\n  /utils\n    prompt.ts\n    retrieval.ts\n  nuxt.config.ts\n```\n\n### 2) Modulo Nuxt per Ollama (pattern)\nCreare un modulo Nuxt consente di incapsulare la logica di connessione, configurazione e helper per chiamare Ollama.\n\n**index.ts (scheletro del modulo)**:\n\n```Ts\nimport { defineNuxtModule, addServerHandler } from '@nuxt/kit'\n\nexport default defineNuxtModule({\n  meta: { name: 'nuxt-ollama' },\n  defaults: { baseUrl: 'http://localhost:11434', model: 'your-model' },\n  setup(options, nuxt) {\n    // aggiungi server route helper\n    addServerHandler({\n      route: '/api/ollama/proxy',\n      handler: '~/server/api/ollama.proxy.ts'\n    })\n    // esporre runtimeConfig\n    nuxt.options.runtimeConfig.ollama = options\n  }\n})\n```\n\n### 3) Server route: `/server/api/ai/query.post.ts`\nEsempio semplificato (TypeScript):\n```Ts\nimport { defineEventHandler, readBody } from 'h3'\nimport { callOllama } from '~/server/api/ollama.client'\n\nexport default defineEventHandler(async (event) => {\n  const body = await readBody(event)\n  const userQuery = body.query\n  // autenticazione e rate limit qui\n  // retrieval opzionale\n  const contextChunks = await getContextForQuery(userQuery)\n  const prompt = buildPrompt(contextChunks, userQuery)\n  const resp = await callOllama(prompt)\n  return { answer: resp.text, sources: contextChunks.map(c => c.source) }\n})\n```\n\n### 4) Client helper (callOllama)\n```Ts\nimport $fetch from 'ohmyfetch'\n\nexport async function callOllama(prompt: string) {\n  const cfg = useRuntimeConfig().ollama\n  const res = await $fetch(`${cfg.baseUrl}/api/generate`, {\n    method: 'POST',\n    body: { model: cfg.model, prompt, max_tokens: 512, temperature: 0.2 }\n  })\n  return res\n}\n```\n**Nota**: verificare l’endpoint e il payload effettivo dell’API Ollama locale; adattare headers e gestione streaming se necessario.\n\n### Prompt engineering e gestione del contesto\n- **System prompt**: definire ruoli, limiti e stile di risposta.\n- **Context window**: includere solo i chunk più rilevanti (top‑k) e sintetizzare se necessario.\n- **Template**: usare template con segnaposto e token counting per evitare overflow.\n- **Esempio di template**:\n\n```Codice\nSystem: Sei un assistente tecnico. Usa solo le informazioni fornite.\nContext:\n[1] ... (source: docA)\n[2] ... (source: docB)\nUser: <user query>\nAnswer:\n```\n### RAG e agenti IA in Nuxt\nPer agenti che eseguono azioni (es. eseguire query su DB, chiamare API esterne, aggiornare stato), separare chiaramente:\n- **Planner**: decide quali azioni eseguire (basato su LLM).\n- **Executor**: esegue azioni autorizzate dal server (non dal client).\n- **Verifier**: controlla output e applica regole di sicurezza.\n\nImplementare un loop di controllo per evitare che l’agente esegua azioni non previste: ogni azione proposta dall’LLM deve passare una policy engine (whitelist/blacklist).\n\n### Best practice per produzione\n- **Autenticazione e autorizzazione**: proteggere endpoint server; non esporre Ollama direttamente.\n- **Rate limiting e quota**: evitare abusi locali; implementare limiti per utente/chiave.\n- **Logging e auditing**: tracciare prompt, risposte e sorgenti per debugging e compliance.\n- **Caching**: cache delle risposte per query ripetute; TTL configurabile.\n- **Monitoraggio risorse**: metriche di utilizzo CPU/GPU, memoria e latenza delle inferenze.\n- **Aggiornamento modelli**: versionare modelli e mantenere rollback plan.\n\n### Esempi avanzati e ottimizzazioni\n- **Streaming**: usare streaming di token per migliorare UX (progressive rendering).\n- **Reranking**: combinare retrieval vettoriale con un cross‑encoder per migliorare precisione.\n- **Embeddings on demand**: delegare embedding a microservizio Python se si usano librerie mature.\n- **Edge deployment**: per ambienti con risorse limitate, scegliere modelli quantizzati o ottimizzati per CPU.\n\n### Considerazioni sulla privacy e compliance\n- **Dati sensibili**: non inviare dati sensibili a servizi esterni; mantenere tutto on‑premise.\n- **Retention**: definire politiche di conservazione dei log e dei prompt.\n- **Access control**: limitare chi può caricare modelli o eseguire inferenze.\n\n### Checklist rapida per l’implementazione\n1. Installare e testare Ollama localmente.\n2. Creare modulo Nuxt per incapsulare configurazione e helper.\n3. Implementare server routes che orchestrano retrieval, prompt e chiamate a Ollama.\n4. Proteggere gli endpoint con autenticazione e rate limiting.\n5. Aggiungere caching, logging e monitoraggio.\n6. Testare casi limite: prompt lunghi, errori di modello, carichi elevati.\n\n## Conclusione\nIntegrare Ollama con Nuxt 4 Modules consente di costruire applicazioni web che sfruttano LLM in locale, con vantaggi in termini di privacy, latenza e controllo. La chiave è mantenere la logica di inferenza sul server, progettare prompt e retrieval in modo modulare e applicare solide pratiche di sicurezza e monitoraggio. Per progetti RAG o agenti IA, la separazione tra planner ed executor e l’uso di vector DB per retrieval miglioreranno robustezza e qualità delle risposte.\n\nQui di seguito potrete trovare un repository di esempio di Ollama + Nuxt 4 Modules + integrazione Python con (README e file pronti)\n\n[Repository di esempio di Ollama + Nuxt 4 Modules + integrazione Python](https://devkernelpulse.org/blog/repository-esempio-di-ollama-nuxt-4-modules-integrazione-python)\n\n	Come integrare agenti IA e modelli trasformativi direttamente sulle tue macchine locali senza dipendenze cloud esterne.	3	7	1	published	t	DKP-VAULT-CERT-ADMIN-K1J7O2	37cc506a0c635eb77a1ee53d45d37b7cc1262b46172a93e628eb29679b8fdac9	9	1	2026-10-13 04:26:34.730057	2026-10-13 04:26:34.730057	["RAG", "Ollama", "Local AI", "Python", "Agent AI", "LLM", "Nuxt 4", "Embedding"]
46	Nuxt per chi conosce Vue: pagine, routing e rendering lato server	nuxt-per-chi-conosce-vue-pagine-routing-e-rendering-lato-server	## Introduzione\n\nSe conosci già **Vue 3**, passare a **Nuxt** è un naturale passo successivo quando vuoi costruire applicazioni con **routing automatico**, **rendering lato server**, ottimizzazione SEO e flussi di dati strutturati. Nuxt non è solo un framework: è un ecosistema che aggiunge convenzioni, tooling e runtime (Nitro) per semplificare lo sviluppo full‑stack con Vue. Questo articolo tecnico‑approfondito spiega le differenze pratiche rispetto a un’app Vue tradizionale, come funzionano **pagine**, **routing** e **strategie di rendering**, e fornisce esempi concreti e pattern consigliati per migrare o iniziare un progetto Nuxt.\n\n## 1. Filosofia e vantaggi di Nuxt rispetto a Vue puro\n- **Convenzione su configurazione**: Nuxt fornisce una struttura di progetto opinata (pages, layouts, composables, `server/api`) che riduce boilerplate e decisioni ripetitive.\n- **Routing automatico**: basta creare file in `pages/` per avere route generate automaticamente.\n- **Rendering flessibile**: supporto nativo per SSR, SSG, ISR e rendering ibrido.\n- **Full‑stack con Nitro**: endpoint serverless e API integrate (/server/api) senza dover configurare un backend separato.\n- **Ottimizzazione SEO e performance**: head management, prefetching, e rendering lato server per contenuti indicizzabili.\n\nSe in Vue gestisci manualmente router, entry points e build, in Nuxt molte di queste responsabilità sono già orchestrate.\n\n## 2. Struttura minima di un progetto Nuxt (confronto pratico)\n\n==Vue app (tipica):==\n\n```Codice\nsrc/\n  main.ts\n  App.vue\n  router/\n    index.ts\n  components/\n  views/\n```\n\n==Nuxt app:==\n\n```Codice\napp/\n  components/\n  composables/\n  layouts/\n  pages/\n  server/\n  plugins/\nnuxt.config.ts\n```\n- In Nuxt non scrivi `main.ts` né configuri manualmente il router: la CLI e il runtime generano l’entry e il router basandosi su `pages/` e `nuxt.config.ts`.\n\n## 3. Pagine e routing automatico\n\n### 3.1 Pages directory\n\nOgni file .vue in pages/ diventa una route. La struttura delle cartelle mappa l’URL.\n\n==Esempi:==\n\n```Codice\npages/\n  index.vue            -> /\n  about.vue            -> /about\n  blog/\n    index.vue          -> /blog\n    [slug].vue         -> /blog/:slug\n    author/\n      [id].vue         -> /blog/author/:id\n```\n### 3.2 Route params e catch‑all\n- `[param].vue` → route dinamica singola.\n- `[...all].vue` → catch‑all (sostituisce `*`).\n\n### 3.3 Nested routes e layouts\n- `layouts/` definisce wrapper condivisi (`default.vue`, `admin.vue`).\n- In `pages/` puoi usare `<NuxtLayout name="admin">` o impostare layout via `definePageMeta({ layout: 'admin' })`.\n\n### 3.4 Route meta e middleware\n- `definePageMeta()` permette di aggiungere meta (title, middleware, auth).\n- Middleware (sia globale che per pagina) gestisce autenticazione, redirect e logica pre‑render.\n\n## 4. Rendering: SSR, SSG, ISR e CSR\n\nNuxt supporta più modalità di rendering; la scelta dipende da SEO, performance e frequenza di aggiornamento dei contenuti.\n\n### 4.1 SSR (Server‑Side Rendering)\n- **Cosa**: la pagina viene renderizzata sul server per ogni richiesta e inviata come HTML pronto.\n- **Vantaggi**: SEO, primo paint veloce, contenuto sempre aggiornato.\n- **Quando**: contenuti dinamici che devono essere indicizzati o personalizzati per utente.\n\n**Pattern**: usare `useAsyncData()` o `useFetch()` nei componenti di pagina per caricare dati lato server.\n\n```Ts\n// pages/index.vue\n<script setup lang="ts">\nconst { data } = await useAsyncData('posts', () => $fetch('/api/posts'))\n</script>\n```\n### 4.2 SSG (Static Site Generation)\n- **Cosa**: le pagine vengono generate al build time come HTML statico.\n- **Vantaggi**: massima performance e hosting economico (CDN).\n- **Quando**: contenuti che cambiano raramente (blog, docs).\n\n**Pattern**: nuxt generate o nitro prerender con routeRules per definire quali route prerenderizzare.\n\n### 4.3 ISR (Incremental Static Regeneration)\n- **Cosa**: pagine statiche rigenerate on‑demand o a intervalli, combinando SSG e aggiornamenti.\n- **Vantaggi**: performance SSG con freschezza dei dati.\n- **Quando**: siti con contenuti aggiornati frequentemente ma che beneficiano di caching.\n\n**Pattern**: configurare `routeRules` con `isr: { swr: true, revalidate: 60 }` o usare endpoint Nitro che invalidano cache.\n\n### 4.4 CSR (Client‑Side Rendering)\n- **Cosa**: rendering completamente lato client; utile per parti dell’app che non richiedono SEO.\n- **Pattern**: usare `client-only` o caricare componenti dinamici con `defineAsyncComponent`.\n\n## 5. Fetching dei dati: composables e API server\n\n### 5.1 `useFetch` / `useAsyncData`\n- `useFetch` è pensato per chiamate HTTP; `useAsyncData` per qualsiasi operazione asincrona.\n- Entrambi funzionano sia in SSR che CSR e integrano caching e revalidation.\n\n```Ts\nconst { data, pending, error } = await useFetch('/api/posts')\n```\n### 5.2 API server con Nitro\n- Crea endpoint serverless in `server/api/`:\n\n```Ts\n// server/api/posts.get.ts\nexport default defineEventHandler(async (event) => {\n  return await fetchPostsFromDB()\n})\n```\n- Questi endpoint possono essere chiamati con `$fetch('/api/posts'`) o direttamente dal server durante SSR.\n\n### 5.3 State management\n- Nuxt supporta Pinia nativamente; puoi creare store in `stores/` e usarli sia client che server.\n- Pattern: popolare store durante SSR e serializzare lo stato al client.\n\n## 6. Meta, head e SEO\n\n- Usa `useHead()` o `definePageMeta()` per gestire title, meta description, og tags.\n- Nuxt gestisce la serializzazione degli head tags durante SSR per SEO e social preview.\n\n```Ts\ndefinePageMeta({\n  head: {\n    title: 'Home - My Nuxt App',\n    meta: [{ name: 'description', content: '...' }]\n  }\n})\n```\n\n## 7. Routing avanzato: middleware, layouts dinamici e i18n\n\n- **Middleware**: `middleware/auth.global.ts` o middleware per pagina con `definePageMeta({ middleware: 'auth' })`.\n- **Layouts dinamici**: scegliere layout in base a route o dati (`const layout = computed(() => user.isAdmin ? 'admin' : 'default')`).\n- **i18n**: integrazione con `@nuxtjs/i18n` o soluzioni basate su composables per SSR‑friendly translations.\n\n## 8. Performance e best practice\n\n- **Prefetching**: Nuxt prefetcha link visibili; usa `nuxt-link` per sfruttarlo.\n- **Code splitting**: componenti lazy con dynamic import.\n- **Image optimization**: usare `@nuxt/image` o soluzioni integrate per ottimizzare e servire immagini responsive.\n- **Cache e CDN**: prerendering + CDN per SSG; cache control per SSR con Nitro.\n- **Bundle analysis**: `nuxi analyze` per identificare dipendenze pesanti.\n\n## 9. Migrazione da Vue a Nuxt: checklist pratica\n\n1. **Struttura**: sposta views in `pages/`, componenti in `components/`.\n2. **Routing**: rimuovi `router/index.ts`; Nuxt genera le route.\n3. **Entry e store**: rimuovi `main.ts`; configura Pinia in `stores/`.\n4. **API**: sposta API server in `server/api/` o mantieni backend esterno.\n5. **Meta**: sostituisci `vue-meta` con `useHead()`/`definePageMeta()`.\n6. **Env e runtime config**: usa `nuxt.config.ts` e `runtimeConfig`.\n7. **Test e CI**: aggiorna pipeline per build SSR/SSG (build + nitro prerender o deploy target).\n\n## 10. Esempio pratico: pagina blog con SSR e route dinamica\n\n==File: `pages/blog/[slug].vue`==\n\n```Vue\n<script setup lang="ts">\nconst { params } = useRoute()\nconst { data: post } = await useAsyncData(`post-${params.slug}`, () =>\n  $fetch(`/api/posts/${params.slug}`)\n)\n</script>\n\n<template>\n  <article v-if="post">\n    <h1>{{ post.title }}</h1>\n    <div v-html="post.content"></div>\n  </article>\n</template>\n```\n\n==Endpoint: `server/api/posts/[slug].get.ts`==\n\n```Ts\nexport default defineEventHandler(async (event) => {\n  const { slug } = event.context.params\n  return await getPostBySlug(slug)\n})\n```\nQuesto pattern rende la pagina SEO‑friendly (SSR) e mantiene la logica di fetching centralizzata nel server.\n\n## 11. Deploy e runtime: Nitro e hosting\n- **Nitro** è il runtime di Nuxt che consente build per target diversi: serverless, Node, Deno, edge.\n- **Hosting**: Vercel, Netlify, Render, Cloudflare Pages (edge), o provider tradizionali con Node. Scegli in base al modello di rendering (SSG preferisce CDN, SSR richiede runtime).\n- **Configurazione**: `nitro` e `routeRules` in `nuxt.config.ts` per caching, prerender e ISR.\n\n## 12. Debugging e strumenti utili\n- `nuxi dev` per sviluppo locale con HMR.\n- `nuxi build` + `nuxi preview` per testare build SSR.\n- `nuxi generate` per SSG.\n- `nuxi analyze` per bundle analysis.\n- Logging server con `useLogger()` e `defineEventHandler` per endpoint Nitro.\n\n## 13. Conclusione e raccomandazioni pratiche\n\nPer uno sviluppatore Vue, Nuxt offre **convenzioni che accelerano lo sviluppo** e **feature server‑side** che migliorano SEO e performance. Le aree chiave da padroneggiare sono:\n- struttura `pages/` e routing automatico;\n- fetching dei dati con `useFetch`/`useAsyncData`;\n- scelta della strategia di rendering (SSR/SSG/ISR/CSR);\n- API server con Nitro e integrazione con Pinia;\n- ottimizzazione per performance e SEO.\n\n\n\n\n	Guida tecnica per sviluppatori Vue che vogliono adottare Nuxt: struttura delle pagine, routing automatico, strategie di rendering (SSR, SSG, ISR) e integrazione con store e API.	13	175	40	published	t	DKP-VAULT-CERT-ADMIN-0LPXVW	da5c13f1dcd5bdbce968b47e6a546b5fa7d578074a1f8cdb1a7327ff63db7adc	2	1	2026-10-20 05:13:26.80988	2026-10-20 05:13:26.80988	["Nuxt", "Nuxt4", "Vue", "Vue3", "SSR", "SSG", "Routing", "Nitro", "Pages", "Layouts", "Typescript", "HTML", "Vite", "Server‑Side Rendering", "Static Site Generation", "Incremental Static Regeneration", "composables", "Pinia"]
38	Drizzle ORM con Neon: schema, migrazioni e query type‑safe	drizzle-orm-con-neon-schema-migrazioni-e-query-type-safe	## Introduzione\n\nDrizzle ORM è una libreria TypeScript‑first che punta a fornire **query type‑safe**, mapping minimale e integrazione stretta con il tipo TypeScript dello schema. Neon è un servizio Postgres serverless che si integra bene con workflow moderni (dev‑preview, branch DB, ecc.). Insieme offrono un flusso di lavoro efficiente per sviluppare applicazioni con garanzie di tipo, migrazioni riproducibili e deployment su infrastrutture cloud. Questo articolo spiega come progettare lo schema, gestire migrazioni e scrivere query type‑safe con esempi pratici e consigli operativi. Noi di DevKernelPulse utilizziamo **Drizzle ORM** con **drizzle-kit** su server **Neon Postgres SQL** database.\n\n## Panoramica architetturale e prerequisiti\n\n**Componenti principali**\n- **Drizzle ORM**: definizione dello schema in TypeScript, generatori di tipi e API per query type‑safe.\n- **Neon (Postgres)**: database serverless compatibile Postgres; utile per branch DB e workflow cloud.\n- **Migrazioni**: script che evolvono lo schema in modo ripetibile e tracciabile (Drizzle fornisce tooling per migrazioni).\n\n**Prerequisiti**\n- Node.js 18+ e TypeScript configurato.\n- Account Neon e una connessione Postgres (connection string).\n- Progetto TypeScript con drizzle-orm e drizzle-kit (o pacchetti equivalenti) installati.\n\n## 1. Modellare lo schema con Drizzle\n\nDrizzle incoraggia la definizione dello schema in TypeScript: tabelle, colonne e relazioni sono espresse come oggetti che generano tipi utili per le query.\n\n**Esempio: definizione tabelle (TypeScript)**\n\n```Ts\n// src/db/schema.ts\nimport { pgTable, serial, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";\n\nexport const users = pgTable("users", {\n  id: serial("id").primaryKey(),\n  email: varchar("email", { length: 255 }).notNull(),\n  name: text("name"),\n  created_at: timestamp("created_at").defaultNow().notNull(),\n});\n\nexport const posts = pgTable("posts", {\n  id: serial("id").primaryKey(),\n  author_id: integer("author_id").notNull().references(() => users.id),\n  title: text("title").notNull(),\n  content: text("content"),\n  published_at: timestamp("published_at"),\n});\n```\n**Vantaggi**\n- I tipi TypeScript derivati dallo schema permettono autocompletamento e controllo statico sulle colonne e sui risultati delle query.\n\n## 2. Migrazioni: flusso e best practice\n\n**Drizzle** fornisce strumenti per generare e applicare migrazioni basate sullo schema `TypeScript` o su `SQL` esplicito. Le migrazioni devono essere trattate come codice: versionate, revisionate in PR e applicate in **CI/CD**.\n\n**Flusso consigliato**\n1. **Sviluppo locale**: modifica `schema.ts` o crea file di migrazione SQL.\n2. **Genera migrazione**: usa `drizzle-kit` (o CLI equivalente) per generare uno script di migrazione che rappresenta la differenza tra schema attuale e desiderato.\n3. **Review**: apri PR, rivedi la migrazione (attenzione a operazioni destructive).\n4. **CI**: esegui migrazioni su un DB di staging/branch DB (Neon supporta branch DB per test isolati).\n5. **Deploy**: applica migrazioni in produzione con controllo delle finestre di manutenzione e backup.\n\n**Esempio di comando (schematico)**\n\n```Bash\n# genera migrazione basata sullo schema\nnpx drizzle-kit generate:pg --out migrations\n# applica migrazioni\nnpx drizzle-kit migrate:up\n```\n**Consigli pratici**\n- Evita `ALTER TABLE ... DROP COLUMN` senza deprecazione preventiva.\n- Per colonne grandi o costose, usa pattern in due step: aggiungi nuova colonna, backfill, switch reader, poi rimuovi la vecchia.\n- Testa migrazioni su snapshot DB o branch DB Neon prima di applicare in produzione.\n\n**3. Connessione a Neon e configurazione**\nNeon fornisce connection string compatibili Postgres. In ambiente Node/TypeScript, usa un pool (es. `pg `o driver supportato da Drizzle) e mantieni la connection string in variabili d’ambiente.\n\n**Esempio di setup (TypeScript)**\n\n```Ts\n// src/db/client.ts\nimport { drizzle } from "drizzle-orm/node-postgres";\nimport { Pool } from "pg";\nimport * as schema from "./schema";\n\nconst pool = new Pool({\n  connectionString: process.env.DATABASE_URL,\n  // opzioni di pool: max, idleTimeoutMillis, etc.\n});\n\nexport const db = drizzle(pool, { schema });\n```\n**Note**\n- Neon può avere caratteristiche serverless (connessioni brevi); configura il pool con attenzione (max connections, idle timeout).\n\n## 4. Query type‑safe: esempi pratici\nDrizzle espone API che riflettono lo schema, consentendo query con tipi derivati.\n\n**Select semplice**\n\n```Ts\nimport { db } from "./db/client";\nimport { users } from "./db/schema";\n\nasync function getUserById(id: number) {\n  const user = await db.select().from(users).where(users.id.eq(id)).limit(1);\n  return user[0] ?? null;\n}\n```\n**Join e mapping**\n\n```Ts\nimport { posts, users } from "./db/schema";\n\nasync function getPostsWithAuthor() {\n  const rows = await db\n    .select({\n      postId: posts.id,\n      title: posts.title,\n      authorName: users.name,\n      authorEmail: users.email,\n    })\n    .from(posts)\n    .leftJoin(users, users.id.eq(posts.author_id))\n    .orderBy(posts.published_at.desc());\n\n  return rows; // tipi garantiti da TypeScript\n}\n```\n**Insert con ritorno di tipi**\n\n```Ts\nconst newPost = await db\n  .insert(posts)\n  .values({\n    author_id: 1,\n    title: "Nuovo post",\n    content: "Contenuto...",\n  })\n  .returning();\n```\n**Aggiornamento e transazioni**\n\n```Ts\nawait db.transaction(async (tx) => {\n  await tx.update(posts).set({ title: "Titolo aggiornato" }).where(posts.id.eq(10));\n  await tx.insert(...);\n});\n```\nQuesti pattern mantengono la sicurezza dei tipi e riducono errori runtime dovuti a mismatch di colonne o tipi.\n\n## 5. Validazione e mapping tra DB e dominio\nSebbene Drizzle fornisca tipi per le colonne, è buona pratica validare input/uscita a livello applicativo (es. con Zod) e mappare DTO/entità per separare responsabilità.\n\n**Esempio con Zod**\n\n```Ts\nimport { z } from "zod";\n\nconst UserSchema = z.object({\n  id: z.number(),\n  email: z.string().email(),\n  name: z.string().nullable(),\n  created_at: z.string(), // o z.date() se convertito\n});\n\nconst user = UserSchema.parse(dbResult);\n```\n\n## 6. Testing: unit e integrazione con Neon\n**Testing locale**\n- Usa un DB Postgres locale o container Docker per test rapidi.\n- Per test di integrazione realistici, Neon permette branch DB isolati: crea un branch DB per ogni PR e applica migrazioni per testare il flusso completo.\n\n**Esempi**\n- **Unit tests**: mock del layer `db` o usare in‑memory stubs.\n- **Integration tests**: eseguire migrazioni e popolare dati di test, poi eseguire query reali.\n\n## 7. CI/CD: applicare migrazioni e deploy\n**Pattern consigliato**\n- **Pipeline PR**: esegui lint, test unitari e integration tests contro un branch DB Neon.\n- **Pipeline main**: generazione artefatti, applicazione migrazioni su staging, smoke tests, approvazione manuale, applicazione su produzione.\n\n**Esempio (GitHub Actions schematico)**\n- **Step**: checkout → setup Node → install deps → `run drizzle-kit migrate:status` → `drizzle-kit migrate:up` (staging) → run smoke tests → manual approval → migrate production.\n\n**8. Performance e operazioni**\n**Connessioni e pool**\n- Neon serverless può imporre limiti; usa pool con limiti ragionevoli e strategie di retry/backoff.\n**Indice e schema**\n- Progetta indici per query frequenti; evita SELECT * in produzione.\n- Usa EXPLAIN ANALYZE per ottimizzare query complesse.\n**Osservabilità**\n- Logga query lente, usa tracing distribuito per correlare richieste applicative e query DB.\n\n**9. Migrazioni avanzate e rollback**\n- **Backfill safe**: per modifiche che richiedono backfill, esegui operazioni in più step e monitora l’impatto.\n- **Rollback**: mantieni script di rollback per ogni migrazione; testali in ambiente isolato.\n- **Zero‑downtime**: evita lock pesanti; preferisci alterazioni non bloccanti o strategie blue/green per cambi strutturali.\n\n## 10. Esempio completo: progetto minimale\n\n```Codice\n/project\n  /src\n    db/\n      schema.ts\n      client.ts\n    services/\n      posts.ts\n  drizzle.config.ts\n  package.json\n  migrations/\n```\n**Script utili (package.json)**\n\n```Json\n{\n  "scripts": {\n    "migrate:generate": "drizzle-kit generate:pg --out migrations",\n    "migrate:up": "drizzle-kit migrate:up",\n    "migrate:down": "drizzle-kit migrate:down",\n    "test": "vitest"\n  }\n}\n```\n## Conclusione e passi successivi\n\nDrizzle ORM + Neon è una combinazione potente per applicazioni TypeScript che richiedono **sicurezza dei tipi**, migrazioni gestite e workflow cloud‑native. I punti chiave da portare a casa:\n- Definisci lo schema in TypeScript per ottenere tipi end‑to‑end.\n- Tratta le migrazioni come codice: generazione, review e CI.\n- Sfrutta le feature di Neon (branch DB) per testare migrazioni in isolamento.\n- Monitora pool di connessioni e performance per adattarti al modello serverless.\n\n\n\n\n	Guida tecnica su come modellare lo schema, gestire migrazioni e scrivere query type‑safe con Drizzle ORM su Neon: best practice, esempi pratici e flussi di lavoro per sviluppo e produzione.	8	25	1	published	t	DKP-VAULT-CERT-ADMIN-4UTFPD	883d47e12dd142df61fa429db371fc36596fff83b49d95cef841bedd93b7d314	2	1	2026-10-16 06:09:31.062694	2026-10-16 06:09:31.062694	["Drizzle ORM", "Neon", "TypeScript", "Migrations", "Type-safe Queries", "Postgres", "ORM", "CI/CD", "Drizzle  Shema", "pnpm/npm", "ts-node", "Zod", "CI", "Docker", "Postgres serverless", "Node.js/TypeScript", "drizzle-kit"]
45	Pubblicare un progetto open source: licenza, documentazione e contributi	pubblicare-un-progetto-open-source-licenza-documentazione-e-contributi	## Introduzione\n\nPubblicare un progetto open source non significa solo rendere pubblico un repository: richiede **scelte tecniche**, **responsabilità legali**, **processi di collaborazione** e una **documentazione chiara**. Un progetto ben strutturato aumenta la credibilità, facilita l’adozione e incoraggia contributi di qualità. In questo articolo analizziamo i tre pilastri fondamentali: **licenza**, **documentazione**, **gestione dei contributi**, con esempi concreti e best practice adottate dai progetti open source più maturi.\n\n## 1. Scegliere la licenza: cosa significa davvero\n\nLa licenza definisce come altri possono usare, modificare e distribuire il tuo codice. È una decisione legale e strategica: influenza la diffusione del progetto, la compatibilità con altri software e la protezione del tuo lavoro.\n==MIT==\n- Permissiva, semplice, ideale per librerie e tool.\n- Consente uso commerciale, modifica e redistribuzione con poche restrizioni.\n\n==Apache‑2.0==\n- Permissiva come MIT, ma include protezione sui brevetti.\n- Preferita in contesti enterprise.\n\n==GPL‑3.0==\n-  Simile a MIT, con clausole aggiuntive di responsabilità.\n\n### Come scegliere\n- Vuoi massima diffusione? MIT o Apache‑2.0.\n- Vuoi garantire che tutto resti open source? GPL‑3.0.\n- Hai utenti enterprise? Apache‑2.0 è spesso preferita.\n\nInserisci la licenza nel file `LICENSE` alla radice del repository e nel `README`.\n\n## 2. Documentazione: la base per l’adozione\n\nLa documentazione è spesso più importante del codice: determina se qualcuno riuscirà a usare il tuo progetto.\n\n### Elementi essenziali\n\n==README.md==\n\nIl biglietto da visita del progetto. Deve includere:\n- Descrizione chiara del progetto\n- Installazione e setup\n- Esempi di utilizzo\n- Requisiti tecnici\n- Link alla documentazione completa\n- Badge (build status, licenza, versioni)\n\n==CONTRIBUTING.md==\n\nSpiega come contribuire:\n- Regole per aprire issue e PR\n- Linee guida di coding style\n- Come eseguire test e build\n- Branching model (es. GitFlow, trunk‑based)\n\n==CODE_OF_CONDUCT.md==\n\nStabilisce le regole di comportamento nella community.\n\n==CHANGELOG.md==\n\nDocumenta le modifiche versionate (idealmente con Semantic Versioning).\n\n**Documentazione tecnica**\n\nPuò essere in `/docs`, generata con strumenti come Docusaurus, MkDocs o GitHub Pages.\n\n### Best practice\n- Mantieni esempi minimi ma completi.\n- Aggiorna la documentazione insieme al codice (non dopo).\n- Usa diagrammi per architettura e flussi complessi.\n- Fornisci una sezione “FAQ” per problemi comuni.\n\n## 3. Gestione dei contributi: costruire una community sana\n\nUn progetto open source vive grazie ai contributi. Per riceverne di buoni, devi rendere il processo semplice e chiaro.\n\n### Issue e Pull Request Template\n\nGitHub permette di creare template:\n- **Issue template** per bug report e feature request\n- **PR template** per descrivere modifiche, test, impatti e checklist\n\nEsempio di checklist PR:\n- [ ] Ho aggiornato la documentazione\n- [ ] Ho aggiunto test\n- [ ] Ho verificato che la build passi\n- [ ] Ho descritto chiaramente il cambiamento\n\n### Automazione con CI/CD\n\nUna pipeline CI deve:\n- Eseguire test\n- Lintare il codice\n- Validare formati (es. Conventional Commits)\n- Generare build o artifact\n- Segnalare problemi prima della review\n\n### Governance del progetto\n- Nomina maintainer e reviewer.\n- Definisci tempi di risposta (SLA community).\n- Usa milestone e label per organizzare il lavoro.\n- Documenta decisioni architetturali con ADR.\n\n### Come gestire contributi esterni\n- Rispondi rapidamente alle issue.\n- Fornisci feedback costruttivo.\n- Non ignorare PR: anche un “grazie, non è in linea con la roadmap” è meglio del silenzio.\n- Mantieni un tono professionale e inclusivo.\n\n## 4. Versioning e release: professionalizzare il progetto\n\n### Semantic Versioning (SemVer)\n\n`MAJOR.MINOR.PATCH`\n\n- **MAJOR**: breaking changes\n- **MINOR**: nuove feature backward‑compatible\n- **PATCH**: bugfix\n\n### Release automation\n- Usa GitHub Releases\n- Genera changelog automatico\n- Pubblica pacchetti (npm, pnpm, PyPI, crates.io, Docker Hub)\n\n### Tagging\n- Usa tag coerenti (`v1.2.0`)\n- Associa ogni tag a una release documentata\n\n## 5. Checklist finale per pubblicare un progetto open source\n- [ ] Licenza scelta e aggiunta nel repository\n- [ ] README completo e chiaro\n- [ ] CONTRIBUTING.md con regole e processi\n- [ ] CODE_OF_CONDUCT.md per la community\n- [ ] Issue e PR template\n- [ ] CI/CD configurata\n- [ ] CHANGELOG con SemVer\n- [ ] Documentazione tecnica aggiornata\n- [ ] ADR per decisioni architetturali\n- [ ] Prima release pubblicata con tag e note\n\n## 6. 📁 Risorse pronte da usare (file open‑source) \n\n### 1) `README.md`\n\n```markdown\n# Nome del Progetto\n\nBreve descrizione del progetto: cosa fa, perché esiste e quali problemi risolve.\n\n## 🚀 Installazione\n``bash\ngit clone https://github.com/<user>/<repo>.git\ncd <repo>\npnpm install\n``\n```\n📦 ==Utilizzo==\n\nEsempio minimo di utilizzo del progetto:\n\n```bash\npnpm run start\n```\n\n📚 ==Documentazione==\n\nLa documentazione completa è disponibile nella cartella `/docs`.\n\n🤝 ==Contribuire==\n\nLeggi il file `[Sembra che non fosse sicuro mostrare il risultato. Cambiamo le cose e facciamo un altro tentativo.]` per sapere come proporre modifiche, aprire issue e inviare PR.\n\n📄 ==Licenza==\n\nQuesto progetto è rilasciato sotto licenza **MIT** — vedi il file `[Sembra che non fosse sicuro mostrare il risultato. Cambiamo le cose e facciamo un altro tentativo.]`.\n\n⭐ ==Supporto==\n\nSe il progetto ti piace, lascia una stella su GitHub!\n\n```Codice\n---\n==2) `CONTRIBUTING.md`==\n``markdown\n# Contributing Guidelines\n\nGrazie per il tuo interesse nel contribuire! Segui queste linee guida per mantenere il progetto sano e collaborativo.\n\n## 🧩 Come proporre una modifica\n1. Apri una issue descrivendo il problema o la feature.\n2. Attendi feedback da un maintainer.\n3. Crea una branch dedicata:\n   ``bash\n   git checkout -b feature/nome-feature\n```\n4. Invia una Pull Request seguendo il template.\n\n==🧪 Test==\n\nAssicurati che tutti i test passino:\n```bash\npnpm test\n```\n==🧼 Stile del codice==\n- Usa formattazione coerente (Prettier / ESLint).\n- Mantieni PR piccole (< 400 LOC).\n- Documenta ogni nuova funzione o modulo.\n\n==📦 Commit==\n\nUsa Conventional Commits:\n- `feat`: nuova feature\n- `fix`: bugfix\n- `docs`: documentazione\n- `refactor`: miglioramento interno\n- `test`: aggiunta/modifica test\n\n==🔍 Review==\n\nOgni PR deve:\n- avere test\n- aggiornare documentazione\n- passare la CI\n\n```Codice\n---\n\n## 3) `CODE_OF_CONDUCT.md`\n``markdown\n# Code of Conduct\n\n## 📌 Obiettivo\nGarantire un ambiente inclusivo, rispettoso e collaborativo.\n\n## 🤝 Comportamenti attesi\n- Rispetto reciproco\n- Comunicazione chiara e costruttiva\n- Nessuna discriminazione o linguaggio offensivo\n\n## 🚫 Comportamenti non accettati\n- Molestie di qualsiasi tipo\n- Spam o trolling\n- Condivisione di contenuti dannosi\n\n## 📬 Segnalazioni\nPer segnalare comportamenti scorretti, contatta:\n`maintainer@example.com`\n\nLe segnalazioni saranno trattate in modo confidenziale.\n``\n```\n\n## 4) `LICENSE` (MIT)\n\n```markdown\nMIT License\n\nCopyright (c) 2026 <Your Name>\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the “Software”), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software...\n\n[continua testo MIT standard]\n```\n*(Puoi sostituire con Apache‑2.0 o GPL‑3.0 se preferisci.)*\n\n## 5) `.github/ISSUE_TEMPLATE/bug_report.md`\n\n```markdown\n---\nname: Bug Report\nabout: Segnala un problema\n---\n\n## 🐛 Descrizione del bug\nDescrivi chiaramente il problema.\n\n## 🔁 Come riprodurlo\n1. Passo 1\n2. Passo 2\n3. Passo 3\n\n## 📦 Output atteso\nCosa ti aspettavi che accadesse?\n\n## 🖥️ Ambiente\n- OS:\n- Versione del progetto:\n- Node/Python/etc:\n\n## 📎 Log o screenshot\nAggiungi log utili.\n```\n\n## 6) `.github/ISSUE_TEMPLATE/feature_request.md`\n\n```markdown\n---\nname: Feature Request\nabout: Proponi una nuova funzionalità\n---\n\n## ✨ Descrizione\nSpiega la feature che vorresti vedere implementata.\n\n## 🎯 Motivazione\nPerché è utile? Quale problema risolve?\n\n## 📐 Possibile implementazione\nDescrivi una possibile soluzione tecnica.\n```\n\n## 7) `.github/PULL_REQUEST_TEMPLATE.md`\n\n```markdown\n# 🚀 Pull Request\n\n## 📌 Descrizione\nSpiega cosa cambia questa PR.\n\n## 🧪 Test\n- [ ] Ho aggiunto test\n- [ ] Tutti i test passano\n\n## 📚 Documentazione\n- [ ] Ho aggiornato README/Docs\n\n## 🔍 Checklist\n- [ ] PR < 400 LOC\n- [ ] Commit secondo Conventional Commits\n- [ ] CI verde\n\n## 📎 Note aggiuntive\nEventuali dettagli utili per i reviewer.\n```\n## Conclusione\n\nPubblicare un progetto **open source** è un atto di responsabilità **tecnica e comunitaria**. Una buona **licenza**, una **documentazione chiara** e i processi di contributo ben definiti trasformano un semplice repository in un **progetto professionale**, adottabile e sostenibile. Investire tempo in questi aspetti aumenta la qualità del software e crea una community attiva e collaborativa.\n	 Una guida tecnica e approfondita per pubblicare un progetto open source in modo professionale: scelta della licenza, struttura della documentazione, gestione dei contributi e buone pratiche per mantenere il progetto sano e collaborativo.\n	17	286	39	published	t	DKP-VAULT-CERT-ADMIN-JYXG8N	e7388bc1ef7e28855ec8238f44ce6c9e1b4f823f98f4bdae9085f57024030a95	6	1	2026-10-19 17:48:18.978119	2026-10-19 17:48:18.978119	["Open Source", "GitHub", "Licensing", "Documentation", "Community", "CI/CD", "Software Engineering", "Git", "Markdown", "emantic Versioning", "Conventional Commits", "Issue Templates", "Pull Request Templates", "Open Source Licenses", "MIT", "Apache‑2.0", "Nginx", "GPL"]
48	DevKernelPulse v2.5-GOLD: Architettura, Hardening Crittografico e Deployment GCP su Cloud Run	devkernelpulse-v2-5-gold-architettura-hardening-crittografico-e-deployment-gcp-su-cloud-run	# DevKernelPulse v2.5-GOLD: Architettura, Hardening Crittografico e Deployment GCP su Cloud Run\n\nCon il completamento e la sincronizzazione della Milestone **v2.5-GOLD**, l'ecosistema **DevKernelPulse (DKP)** raggiunge una maturità di livello Enterprise. Il progetto si consolida come piattaforma ibrida per sviluppatori, unendo blogging tecnico, notarizzazione del codice (`*Proof of Code Vault*`), rate-limiting ad alte prestazioni tramite ***API Gateway*** e un firewall euristico avanzato (`*Pulse Sentinel AI*`).\n\nIn questo articolo esaminiamo nel dettaglio le scelte architetturali, la transizione crittografica verso funzioni **KDF** (`*Key Derivation Function*`) e le strategie di deployment adottate sulla regione Google Cloud Platform (`europe-west4`).\n\n---\n\n## 🏗️ 1. Architettura Globale dell'Ecosistema\n\nL'infrastruttura **v2.5-GOLD** è progettata secondo un paradigma serverless a micro-latenza, ottimizzato per garantire elevata disponibilità e scalabilità automatica.\n\n```Schema\n              ┌─────────────────────────────────────────┐\n              │          Google Cloud Armor WAF         │\n              └────────────────────┬────────────────────┘\n                                   │\n                                   ▼\n              ┌─────────────────────────────────────────┐\n              │    GCP Cloud Run (europe-west4)         │\n              │    Nuxt 4 / Nitro Server Engine         │\n              └──────┬───────────────────────────┬──────┘\n                     │                           │\n                     ▼                           ▼\n    ┌─────────────────────────┐         ┌─────────────────────────┐\n    │   Pulse Sentinel AI     │         │   DKP Commercial        │\n    │   Firewall Euristico    │         │   API Gateway           │\n    └─────────────────────────┘         └────────────┬────────────┘\n                                                     │\n                                                     ▼\n                                        ┌─────────────────────────┐\n                                        │ Neon PostgreSQL         │\n                                        │ Drizzle ORM             │\n                                        └─────────────────────────┘\n```\n\n             \n\n### Componenti Chiave:\n1. **Frontend & Application Layer**: Sviluppato su **Nuxt 4** con motore di rendering **Nitro**, garantendo tempi di primo caricamento minimi grazie a Server-Side Rendering (SSR) e percorsi API ad alte prestazioni.\n2. **Database Layer**: **Neon PostgreSQL Serverless** gestito tramite **Drizzle ORM** in modalità *Pure SQL*, scelta per azzerare il sovraccarico di astrazione e garantire tempi di risposta dell'ordine dei **14 ms**.\n3. **Execution Runtime**: Deployed su **Google Cloud Run** nella region `europe-west4` (Eemshaven, Paesi Bassi), assicurando bassa latenza verso il traffico europeo e conformità con i requisiti di residency dei dati.\n\n---\n\n## 🛡️ 2. Hardening Crittografico: Da SHA-256 a `scrypt` KDF\n\nNelle iterazioni iniziali, il confronto delle chiavi API avveniva tramite hash `SHA-256` in chiaro. Sebbene `SHA-256` sia crittograficamente sicuro contro le collisioni, la sua velocità di calcolo lo rende vulnerabile ad attacchi *offline brute-force* condotti tramite GPU o cluster dedicati in caso di esportazione malevola della base dati.\n\n### Il Passaggio a `scrypt` (Key Derivation Function)\nPer risolvere i warning di analisi statica **CodeQL** e portare le API Key agli standard della direttiva OWASP, la derivazione del token è stata migrata a **`scrypt`** con *Salt* dinamico da 16-byte e *Pepper* lato server.\n\n`scrypt` è un algoritmo computazionalmente e mnemonicamente oneroso (*memory-hard*), progettato per vanificare i tentativi di calcolo parallelo su hardware specializzato (ASIC/GPU).\n\n### Generazione della Chiave API (`server/api/user/keys/generate.post.ts`)\n\n```Ts\nimport { defineEventHandler, readBody, getCookie } from 'h3'\nimport { randomBytes, scryptSync } from 'node:crypto'\nimport { getDb } from '~~/server/utils/db'\nimport { apiKeys } from '~~/server/db/schema'\n\nexport default defineEventHandler(async (event) => {\n  const db = getDb()\n  const body = (await readBody(event)) || {}\n  \n  // 1. Generazione di 32 byte di entropia pura (64 caratteri hex)\n  const rawSecret = randomBytes(32).toString('hex')\n  const fullApiKey = `dkp_live_${rawSecret}`\n  const keyPrefix = fullApiKey.substring(0, 16)\n  const keyMasked = `${fullApiKey.substring(0, 12)}...${fullApiKey.substring(fullApiKey.length - 4)}`\n\n  // 2. Calcolo KDF con Salt e scrypt\n  const salt = randomBytes(16).toString('hex')\n  const derivedKey = scryptSync(fullApiKey, salt, 64).toString('hex')\n  const hashedKey = `${salt}:${derivedKey}`\n\n  // 3. Persistenza sicura su Neon DB\n  const [insertedKey] = await db\n    .insert(apiKeys)\n    .values({\n      userId: 1,\n      name: body.name || 'Production API Key',\n      keyPrefix,\n      keyMasked,\n      keyHash: hashedKey,\n      role: body.role || 'PRO',\n      status: 'ACTIVE',\n      usageCount: 0,\n      createdAt: new Date()\n    })\n    .returning()\n\n  return {\n    success: true,\n    rawApiKey: fullApiKey, // Restituita SOLO una volta al momento della creazione\n    keyData: insertedKey\n  }\n})\n```\n\n### Validazione nel Middleware (`server/middleware/apiGateway.ts`)\nDurante ogni richiesta diretta alle rotte commerciali `/api/v1/*`, l'API Gateway recupera il salt univoco dal record salvato e ricalcola la derivazione per verificare la chiave a tempo costante:\n\n```Ts\nimport { scryptSync } from 'node:crypto'\n\n// Estrazione del salt e del hash memorizzato\nconst [salt, storedHash] = record.keyHash.split(':')\nconst computedHash = scryptSync(rawApiKey.trim(), salt, 64).toString('hex')\n\nif (computedHash === storedHash) {\n  // Autenticazione riuscita e autorizzazione concessa\n}\n```\n\n## ⚡ 3. API Gateway & Pulse Sentinel AI Firewall\n\n### Rate Limiting Dinamico basato su Tier\n\nIl Gateway applica quote di utilizzo mensili configurate per ciascun piano, comunicando lo stato al client tramite header HTTP standard:\n\n\n| ==Tier== | ==Quota Chiamate / Mese== | ==Latenza Target== |\n|---|---|---|\n| **FREE** | 1.000 req/mese | < 50 ms |\n| **PRO** | 50.000 req/mese | < 25 ms |\n| **ENTERPRISE** | 1.000.000 req/mese | < 15 ms |\n\nHeader restituiti in ogni risposta:\n- `X-RateLimit-Limit`: Quota totale del piano.\n- `X-RateLimit-Remaining`: Conteggio residuo aggiornato in tempo reale su Neon DB.\n- `X-RateLimit-Tier`: Livello di servizio dell'utente.\n\n### Protezione Sentinel AI & Cloud Armor\n- **WAF Euristico**: Rilevamento in tempo reale di pattern SQL Injection, XSS e Scraping automatizzato.\n- **Whitelist & Exemption Manager**: Gestione flessibile degli indirizzi IP fidati (es. runner CI/CD e server di sviluppo) per evitare falsi positivi durante i test integrati.\n- **Alerting Webhooks**: Invio di notifiche push istantanee su canali Telegram e Discord quando il Global Threat Index supera la soglia di allerta (> 50%).\n\n## 🚀 4. Deployment GCP & Cloud Run Setup\n\nLa pipeline di Continuous Deployment (CD) compila il container dell'applicazione ed effettua il roll-out automatico su Google Cloud Run.\n\n### Configurazione `Dockerfile`\n\n\n```Dockerfile\nFROM node:22-alpine AS builder\nWORKDIR /app\nCOPY package.json pnpm-lock.yaml ./\nRUN corepack enable && pnpm install --frozen-lockfile\nCOPY . .\nRUN pnpm run build\n\nFROM node:22-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\nENV PORT=8080\nCOPY --from=builder /app/.output ./.output\n\nEXPOSE 8080\nCMD ["node", ".output/server/index.mjs"]\n```\n### Parametri di Scalabilità Cloud Run:\n- **Region**: europe-west4\n- **Concurrency**: 80 richieste simultanee per istanza.\n- **Min Instances**: 0 (costi azzerati durante i periodi di inattività).\n- **Max Instances**: 100 (scalabilità orizzontale automatica sotto picchi di traffico).\n\n## 📈 5. Conclusioni e Prossimi Sviluppi\n\nIl rilascio di **DevKernelPulse v2.5-GOLD** segna il completamento dell'infrastruttura fondamentale di sicurezza e governance dei dati. L'ecosistema è ora pienamente allineato con gli standard di sicurezza moderni, pronto a sostenere l'espansione del pubblico di sviluppatori.\n\nI prossimi sviluppi verteranno sul rilascio del pacchetto SDK ufficiale su `npm` (`@devkernelpulse/sdk`) e sull'integrazione di agenti IA per la riparazione automatica delle vulnerabilità del codice.\n\n***DevKernelPulse Engineering Team — 2026***\n\n\n	Un'analisi architetturale approfondita del rilascio DevKernelPulse v2.5-GOLD: dalla migrazione crittografica delle API Key a scrypt KDF, fino al deployment containerizzato su GCP Cloud Run (europe-west4) e al database serverless Neon PostgreSQL.	7	21	42	published	t	DKP-VAULT-CERT-ADMIN-T8ATM5	fbef498e28e11b16d658430d6fba0e4acba5322601ebb0dc1f0509a82c30e838	1	1	2026-10-20 15:57:06.170663	2026-10-20 15:57:06.170663	["Nuxt 4", "Nitro Engine", "Node.js", "scrypt (KDF)", "Neon PostgreSQL", "Drizzle ORM", "GCP Cloud Run (europe-west4)", "Google Cloud Armor", "v2.5-GOLD", "GCP", "Cloud Run", "Cryptography", "scrypt", "PostgreSQL", "Nuxt", "Security", "API Gateway", "KDP", "DevKernelPulse"]
47	Come proteggere le API con OAuth 2.0 e OpenID Connect	come-proteggere-le-api-con-oauth-2-0-e-openid-connect	## Introduzione\n\nProteggere le **API** è un requisito fondamentale per qualsiasi architettura a microservizi o applicazione esposta. **OAuth 2.0** fornisce il quadro per l’autorizzazione delegata, mentre **OpenID Connect (OIDC)** aggiunge l’autenticazione federata e l’identità dell’utente. Insieme, questi standard permettono di separare responsabilità tra **Identity Provider (IdP)** e **resource servers (API)**, abilitando scenari come single sign‑on, accesso delegato da client pubblici/privati e integrazione con **API Gateway**.\n\nQuesto articolo tecnico spiega i concetti chiave, i flussi più rilevanti, come validare e gestire token (JWT e reference tokens), quando usare introspezione, come integrare un API Gateway, e le best practice operative per sicurezza, scalabilità e compliance.\n\n## 1. Concetti fondamentali: ruoli e token\n- **Resource Owner**: utente o entità che possiede le risorse.\n- **Client**: applicazione che richiede accesso (public o confidential).\n- **Authorization Server / IdP**: emette token (access token, refresh token, ID token).\n- **Resource Server (API)**: valida token e applica autorizzazione.\n\n==Token principali==\n- **Access Token**: prova di autorizzazione; usato per chiamare API. Può essere un **JWT (self‑contained)** o un **reference token (opaque)** che richiede introspezione.\n- **Refresh Token**: usato per ottenere nuovi access token; deve essere trattato con cura (confidential clients).\n- **ID Token (OIDC)**: token JWT che contiene informazioni sull’identità dell’utente (sub, email, claims).\n\n## 2. Flussi OAuth/OIDC rilevanti per le API\n\nScegli il flusso in base al tipo di client:\n- **Authorization Code + PKCE (recommended per SPA e mobile)**: codice di autorizzazione scambiato per token; PKCE protegge i client pubblici.\n- **Authorization Code (confidential client)**: per server‑side web app con client secret.\n- **Client Credentials**: per comunicazione server‑to‑server (machine‑to‑machine). Il client ottiene access token senza user context.\n- **Device Authorization**: per dispositivi con input limitato.\n- **Implicit**: deprecato; evitare.\n\n**Raccomandazione**: usare **Authorization Code + PKCE** per user‑facing apps e **Client Credentials** per backend services.\n\n## 3. Validazione dei token: JWT vs reference tokens\n\n### JWT (JSON Web Token)\n**Vantaggi**: self‑contained, la resource server può validare offline (signature, claims, exp). Riduce latenza e carico sull’IdP.\n\n- **Validazioni minime:** \n\n\n- **Signature**: verificare con la chiave pubblica (JWKs endpoint dell’IdP).\n\n\n- **exp / nbf / iat**: controllare scadenza e validità temporale.\n\n\n- **aud (audience)**: assicurarsi che il token sia destinato alla tua API.\n\n\n- **iss (issuer)**: verificare l’issuer atteso.\n\n\n- **scope / permissions / roles**: verificare che il token contenga i permessi necessari.\n\n**Rischi**: revoca difficile (token rimane valido fino a scadenza); gestione chiavi (rotazione) da implementare.\n\n### Reference (opaque) tokens\n- **Vantaggi**: l’IdP mantiene stato e può revocare immediatamente; la resource server esegue introspezione.\n- **Svantaggi**: richiede chiamata all’IdP (latency, disponibilità); caching possibile con TTL.\n\n### Quando usare cosa\n- **JWT**: quando vuoi scalabilità e bassa latenza; implementa meccanismi di revoca (short lived tokens, revocation lists, token versioning).\n- **Reference tokens**: quando revoca immediata è critica o quando non vuoi esporre claims al client.\n\n## 4. Token lifecycle e sicurezza operativa\n\n- **Short‑lived access tokens**: riduci la finestra di esposizione (es. 5–15 minuti).\n- **Refresh tokens**: limitare scope e durata; usare refresh token rotation (IdP che emette nuovo refresh token ad ogni uso e revoca il precedente).\n- **Revoke / introspect**: supportare revoca e introspezione per casi di compromissione.\n- **Key management**: scarica JWKs dall’IdP e implementa caching + key rotation handling (kid header).\n- **Audience separation**: emetti token con audience specifica per ogni API per evitare token reuse cross‑service.\n- **Scopes vs roles**: scopes per azioni (read:posts), roles per RBAC; mappa claims a policy nell’API.\n\n## 5. Validazione pratica in API (pattern)\n\n### Pattern 1 — JWT validation (stateless)\n1. Recupera JWKs dall’IdP (`/.well-known/jwks.json`) e cache.\n2. Verifica signature e `kid`.\n3. Controlla `iss`, `aud`, `exp`,` nbf`.\n4. Controlla `scope` o claim custom.\n5. Applica autorizzazione (RBAC/ABAC) basata su claims.\n\n### Pattern 2 — Introspection (reference tokens)\n1. API invia token all’endpoint di introspezione (`/oauth2/introspect`) con credenziali client.\n2. IdP risponde con `active: true/false` e claims.\n3. API applica autorizzazione.\n4. Cache la risposta per breve periodo per ridurre latenza.\n\n### Pattern 3 — Hybrid\n- Validazione JWT per performance; per revoca o sospetti, eseguire introspezione o check contro revocation list.\n\n## 6. API Gateway e protezione perimetrale\n\nUn **API Gateway** centralizza autenticazione, autorizzazione, rate limiting e logging. Funzioni tipiche:\n- **Token validation** (JWT signature check o introspection).\n- **Scope/role enforcement**: mappare scope a policy.\n- **Rate limiting / quota**: proteggere da abuso.\n- **Mutual TLS (mTLS)**: per comunicazioni tra services e gateway.\n- **Request transformation**: rimuovere/normalizzare headers, aggiungere claims al context.\n- **Audit logging**: tracciare chiamate e decisioni di autorizzazione.\n\n**Esempio**: usare Envoy/Kong/Apigee/NGINX con plugin OIDC per validazione e caching JWKs; delegare policy complesse a un PDP (Policy Decision Point) come OPA (Open Policy Agent).\n\n## 7. Autorizzazione: scopes, roles, ABAC e PDP\n- **Scopes**: granularità operativa (es. `orders:read`). Buoni per controllo semplice.\n- **Roles**: ruoli applicativi (admin, user) spesso gestiti dall’IdP.\n- **ABAC (Attribute‑Based Access Control)**: decisioni basate su claims (es. `department`, `tenant_id`).\n- **PDP (Policy Decision Point)**: esternalizza la logica di autorizzazione (OPA, AWS IAM, Google IAM). API invia contesto e riceve allow/deny.\n\n**Best practice**: mantenere policy dichiarative, testabili e versionate; usare PDP per regole complesse.\n\n## 8. Protezione avanzata: mTLS, DPoP, CIBA, PKCE\n- **mTLS**: autenticazione mutua per comunicazioni server‑to‑server; utile per trust tra microservizi.\n- **DPoP (Demonstration of Proof of Possession)**: mitigare token replay per bearer tokens; client dimostra possesso di chiave privata.\n- **CIBA (Client Initiated Backchannel Authentication)**: per scenari di autenticazione out‑of‑band.\n- **PKCE**: obbligatorio per public clients per mitigare code interception.\n\nValuta l’adozione in base al rischio e alla complessità operativa.\n\n## 9. Logging, monitoring e incident response\n- **Audit logs**: registra issuance, introspection, revocation e decisioni di autorizzazione.\n- **Metrics**: token validation latency, introspection calls, auth failures, rate limit hits.\n- **Alerting**: anomalie di traffico, spike di token failures, revocation events.\n- **Playbooks**: runbook per compromissione di client secrets o leak di refresh token (rotazione, revoca, forzare logout).\n\n## 10. Common pitfalls e come evitarli\n- **Non validare audience/issuer** → rischio token replay.\n- **Token troppo lunghi (long lived)** → maggiore blast radius.\n- **Esposizione di refresh tokens a client pubblici** → usare PKCE + short lived tokens.\n- **Non gestire key rotation** → signature verification fallisce o rimane insicura.\n- **Affidarsi solo a client‑side checks** → server deve sempre validare.\n- **Mancata separazione di audience** → token validi per più API senza controllo.\n\n\n## 11. Esempio pratico: proteggere un’API Node.js (Express) con JWT\n\n```Js\n// pseudocode\nconst jwksClient = require('jwks-rsa');\nconst jwt = require('jsonwebtoken');\n\nconst client = jwksClient({ jwksUri: 'https://idp.example/.well-known/jwks.json' });\n\nfunction getKey(header, callback) {\n  client.getSigningKey(header.kid, (err, key) => {\n    const signingKey = key.getPublicKey();\n    callback(null, signingKey);\n  });\n}\n\nfunction authMiddleware(req, res, next) {\n  const auth = req.headers.authorization;\n  if (!auth) return res.status(401).send('Missing token');\n  const token = auth.split(' ')[1];\n  jwt.verify(token, getKey, { audience: 'api://default', issuer: 'https://idp.example' }, (err, payload) => {\n    if (err) return res.status(401).send('Invalid token');\n    // check scopes/roles\n    req.user = payload;\n    next();\n  });\n}\n```\nPer reference tokens, sostituisci la verifica con una chiamata all’endpoint di introspezione e cache la risposta.\n\n## 12. Checklist rapida di implementazione\n- [ ] Scegli flussi OAuth appropriati (Auth Code + PKCE, Client Credentials).\n- [ ] Usa TLS ovunque (HTTPS).\n- [ ] Emetti access token short‑lived; usa refresh token con rotazione.\n- [ ] Validazione token: signature, iss, aud, exp, scope.\n- [ ] Implementa key rotation e caching JWKs.\n- [ ] Proteggi refresh tokens e client secrets (secure storage).\n- [ ] Usa API Gateway per centralizzare policy e rate limiting.\n- [ ] Abilita logging, monitoring e alerting per auth events.\n- [ ] Prepara runbook per compromissione di credenziali\n\n## 13. Risorse e letture consigliate\n- [RFC 6749](https://www.rfc-editor.org/info/rfc6749/) — OAuth 2.0 Authorization Framework.\n- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html) — specifica OIDC.\n- [FC 7662](https://www.rfc-editor.org/info/rfc7662/) — OAuth 2.0 Token Introspection.\n- [OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/info/rfc9700/) (IETF drafts / guidance).\n- [OWASP API Security](https://api-security.owasp.org/) Top 10.\n\n==Provider docs==: \n- [Auth0](https://auth0.com/docs/api)\n- [Okta](https://auth0.com/docs/authenticate/identity-providers/okta)\n- [Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc)\n- [Google Cloud API security](https://docs.cloud.google.com/apigee/docs/api-security?hl=it)\n\n## Conclusione\n\nProteggere le API con OAuth 2.0 e OpenID Connect richiede una combinazione di **scelte architetturali**, **rigorosa validazione dei token**, **buone pratiche operative** e l’uso di strumenti come **API Gateway** e PDP per centralizzare policy. Prediligi **token a vita breve**, separa audience per servizio, implementa introspezione quando serve e automatizza key rotation e monitoring. Con questi elementi puoi costruire un sistema di autorizzazione robusto, scalabile e manutenibile.\n\n\n\n	Guida tecnica su come proteggere API moderne con OAuth 2.0 e OpenID Connect: modelli di autenticazione e autorizzazione, validazione token, introspezione, revoca, uso di API Gateway e best practice operative.	14	247	41	published	t	DKP-VAULT-CERT-ADMIN-E0VA59	8151b6480285fcffd85ea1b25087a05bccd08b4a3e82461db486c5cadb14c5bc	1	0	2026-10-20 07:02:25.323826	2026-10-20 07:02:25.323826	["OAuth2", "OpenID Connect", "API Security", "JWT", "Token Introspection", "API Gateway", "RBAC", "Best Practices", "Identity Provider", "TLS", "OAuth token introspection", "RBAC/ABAC", "OAuth PKCE"]
43	GCP, Azure o AWS? Come scegliere il cloud provider per un nuovo progetto	gcp-azure-o-aws-come-scegliere-il-cloud-provider-per-un-nuovo-progetto	## Introduzione \n\nQuesto articolo informativo, tecnico e approfondito è pensato per architetti, engineering manager e team tecnici che devono prendere una decisione su di una piattaforma di sviluppo web per il proprio progetto.\n**Obiettivo**: fornire un quadro operativo e ripetibile per valutare i tre principali cloud provider (**AWS**, **Azure**, **GCP**) e arrivare a una scelta motivata in base a requisiti tecnici, organizzativi e di costo.\n\n## Sintesi esecutiva (quick verdict)\n- **Scegli AWS **se cerchi **la più ampia copertura di servizi**, ecosistema maturo e la massima disponibilità globale; è spesso la scelta per progetti con requisiti enterprise complessi e per chi vuole il maggior numero di feature gestite.\n- **Scegli Azure** se la tua organizzazione è **fortemente integrata con Microsoft** (Active Directory, .NET, Office 365) o se hai vincoli enterprise che richiedono integrazione con servizi Microsoft. Azure è competitivo in scenari ibridi e per clienti enterprise.\n- **Scegli GCP** se il progetto punta su **data analytics**, **ML e costi operativi ottimizzati**; GCP eccelle in servizi dati (BigQuery), networking moderno e spesso offre modelli di prezzo vantaggiosi per carichi analitici.\n\nQuesta sintesi è un punto di partenza: nelle sezioni seguenti trovi criteri concreti, metriche da misurare e scenari d’uso che guidano la scelta.\n\n## 1) Criteri decisionali principali\nPer scegliere in modo oggettivo, valuta il provider su questi assi:\n1. **Copertura funzionale** — quali servizi gestiti servono (Kubernetes, DB, ML, streaming, serverless).\n2. **Disponibilità geografica** — regioni, zone e latenza verso i tuoi utenti.\n3. **Prezzo e modello di costo** — struttura dei prezzi, sconti riservati, modelli serverless vs risorse riservate.\n4. **Ecosistema e integrazione** — toolchain esistente (AD, CI/CD, monitoring), partner e marketplace.\n5. **Sicurezza e compliance** — certificazioni, controllo dei dati, regioni per dati sensibili.\n6. **Operatività e skill del team** — competenze interne, disponibilità di ingegneri e costi di formazione.\n7. **Vendor lock‑in e portabilità** — facilità di migrazione, supporto multi‑cloud, uso di tecnologie open (Kubernetes, Terraform).\n8. **Supporto e SLA** — livelli di supporto, contratti enterprise e tempi di risposta.\n\n## 2) Punti di forza e debolezza (high level)\n### AWS — Strengths\n- **Ampiezza di servizi**: il catalogo è il più vasto (compute, storage, analytics, ML, IoT, edge). Ideale per progetti che richiedono servizi specialistici.\n- **Maturità operativa**: ecosistema di partner, tool di terze parti e best practice consolidate.\n- **Copertura globale**: più regioni e AZ rispetto agli altri provider, utile per resilienza e latenza.\n### AWS — Weaknesses\n- **Complessità**: curva di apprendimento e costi di gestione possono essere elevati.\n- **Prezzi**: senza ottimizzazione (RI, Savings Plans, cost allocation) i costi possono crescere rapidamente.\n### Azure — Strengths\n- **Integrazione Microsoft**: integrazione nativa con Active Directory, Windows Server, SQL Server e stack .NET; ottimo per enterprise già Microsoft‑centriche.\n- **Hybrid cloud**: soluzioni come Azure Arc e integrazione on‑premise sono mature.\n- **Offerte enterprise**: contratti e programmi per grandi clienti, supporto commerciale consolidato.\n### Azure — Weaknesses\n- **Coerenza dell’esperienza**: alcune API e servizi possono avere differenze di maturità rispetto ad AWS.\n- **Prezzi e licensing**: la gestione delle licenze Microsoft può complicare il TCO.\n### GCP — Strengths\n- **Dati e ML**: BigQuery, Vertex AI e servizi dati sono tra i migliori per analytics e ML.\n- **Networking e performance**: rete globale moderna e spesso vantaggi di latenza per certi workload.\n- **Modello di prezzo semplice**: sconti per uso sostenuto e modelli competitivi per carichi analitici.\n### GCP — Weaknesses\n- **Ecosistema enterprise**: minore penetrazione enterprise rispetto ad AWS/Azure; meno servizi di nicchia.\n- **Copertura regioni**: meno regioni rispetto ad AWS, da valutare per requisiti di latenza e compliance.\n\n## 3) Requisiti tecnici tipici e raccomandazioni pratiche\n### A. Applicazione web stateless (microservizi, API)\n- **Raccomandazione**: preferisci il provider con il miglior supporto per Kubernetes e integrazione CI/CD del tuo team. Tutti e tre offrono managed Kubernetes (EKS/AKS/GKE); GKE è spesso apprezzato per semplicità operativa, ma EKS e AKS sono solidi in contesti enterprise. Valuta anche i costi del control plane e del networking.\n### B. Data platform e analytics\n- **Raccomandazione**: GCP è leader per analytics (BigQuery) e pipeline dati serverless; AWS compete con Redshift, Athena e servizi Glue; Azure con Synapse. Scegli in base al team di data engineering e agli strumenti già in uso.\n### C. Applicazioni enterprise .NET / Active Directory\n- **Raccomandazione**: Azure è la scelta naturale per integrazione nativa con AD, Windows Server e licensing Microsoft.\n### D. Edge, IoT e global scale\n- **Raccomandazione**: AWS ha la rete più ampia di edge locations e servizi IoT maturi; valuta anche i costi di egress e latenza.\n### E. Progetti ML/AI sperimentali\n- **Raccomandazione**: GCP per Vertex AI e integrazione con BigQuery; AWS per SageMaker se vuoi un ecosistema più ampio di servizi ML.\n\n## 4) Costi: come confrontare realisticamente\n1. **Definisci workload representative**: CPU, RAM, storage, I/O, rete, query analytics.\n2. **Usa i pricing calculators**: ogni provider ha calcolatori ufficiali (AWS Pricing, Azure Pricing Calculator, GCP Pricing). Confronta scenari (on‑demand, reserved, committed use).\n3. **Considera costi nascosti**: egress, API calls, control plane, snapshot, support plan.\n4. **Ottimizzazione**: riserve, autoscaling, right‑sizing, spot/preemptible instances.\n5. **Prova con PoC**: esegui un proof‑of‑concept su ogni provider con metriche reali per stimare il TCO.\n\n## 5) Compliance, dati sensibili e località\n- Verifica **regioni disponibili** per il provider nella tua giurisdizione e le certificazioni (ISO, SOC, GDPR, PCI, HIPAA). La scelta può essere vincolata da requisiti legali o contrattuali.\n\n## 6) Operazioni, supporto e skill del team\n- **Skill interne**: se il team conosce già AWS, passare ad Azure/GCP ha costi di formazione.\n- **Support plans**: per produzione mission‑critical, considera piani di supporto enterprise (costo significativo).\n- **Ecosistema partner**: presenza di system integrator e partner locali può accelerare il progetto.\n\n## \n- **Quando considerarlo**: requisiti di resilienza cross‑provider, evitare lock‑in, sfruttare servizi best‑of‑breed.\n- **Trade‑off**: aumenta complessità operativa, networking e costi; richiede automazione e standardizzazione (Terraform, Kubernetes, service mesh).\n- **Pattern pratici**: usare Kubernetes come livello di astrazione, storage e networking federati con attenzione a latenza e consistenza.\n\n## 8) Processo decisionale pratico (checklist)\n1. **Raccogli requisiti**: performance, compliance, budget, skill, integrazioni.\n2. **Mappa servizi critici**: DB, identity, analytics, ML, networking.\n3. **Esegui PoC**: deploy minimo riproducibile su 2 provider e misura costi/latency/operational effort.\n4. **Valuta TCO su 1/3/5 anni**: includi formazione, support, licenze.\n5. **Considera lock‑in e exit plan**: definisci come migrare dati e workload.\n6. **Scegli e definisci governance**: policy di sicurezza, backup, DR, monitoraggio.\n7. **Formalizza SLA e contratti**: support plan, escalation, responsabilità.\n\n## 9) Esempi di decisione per casi reali\n- **Startup SaaS con focus ML**: GCP (BigQuery + Vertex AI) per time‑to‑insight e costi analitici; valuta anche AWS se vuoi ecosistema più ampio. (Noi di DevKernelPulse)\n- **Enterprise .NET con Active Directory**: Azure per integrazione e licensing.\n- **Global consumer app con requisiti di latenza e edge**: AWS per copertura globale e servizi edge.\n\n## 10) Conclusione e raccomandazioni finali\n\nLa scelta tra **GCP**, **Azure** e **AWS** non è puramente tecnica: è il risultato di un bilanciamento tra requisiti tecnici, vincoli legali, competenze del team e obiettivi di business. Procedi con un processo strutturato: **requisiti → PoC → TCO → governance**. Per la maggior parte dei progetti:\n- **AWS** è la scelta più sicura per ampiezza e resilienza.\n- **Azure** è la scelta naturale per ambienti Microsoft‑centrici.\n- **GCP** è la scelta preferibile per dati, analytics e ML‑centric workloads.\n\n### Risorse utili\n-  [Azure Global Infrastructure (regioni e AZ)](https://aws.amazon.com/it/about-aws/global-infrastructure/regions_az/).\n- [Azure Global Infrastructure](https://aws.amazon.com/it/about-aws/global-infrastructure/).\n- [Google Cloud locations & BigQuery docs](https://docs.cloud.google.com/bigquery/docs/dts-locations?hl=it).\n- [Gartner / Forrester reports per valutazioni enterprise](https://www.fortinet.com/it/solutions/analyst-reports).\n\n\n\n\n\n\n\n	Confronto tecnico e operativo tra GCP, Azure e AWS per scegliere il cloud provider più adatto a un nuovo progetto: criteri decisionali, punti di forza/debolezza, costi, compliance, servizi gestiti e raccomandazioni pratiche.	1	1	38	published	t	DKP-VAULT-CERT-ADMIN-0BC46N	0ba7458dafdddd4abb0842332434647ad1e73e84416bbb8a3d40c665d6a6c694	3	1	2026-10-17 05:29:29.198824	2026-10-17 05:29:29.198824	["Cloud Strategy", "AWS", "Azure", "GCP", "Architecture", "Cost Optimization", "Compliance", "Multi‑Cloud", "Kubernetes", "Serverless", "Managed DB", "Object Storage", "IAM & Security", "CI/CD"]
49	Inside Pulse Sentinel AI v2.5: Anatomia di un Firewall Euristico in Tempo Reale	inside-pulse-sentinel-ai-v2-5-anatomia-di-un-firewall-euristico-in-tempo-reale	# Inside Pulse Sentinel AI v2.5: Anatomia di un Firewall Euristico in Tempo Reale\n\nNel panorama moderno delle applicazioni web gestite in architettura serverless, i Web Application Firewall (WAF) tradizionali basati esclusivamente su firme statiche (*signature-based*) mostrano evidenti limiti contro vettori d'attacco dinamici, botnet distribuite e tentativi di exploit zero-day.\n\nCon la release **v2.5-GOLD** dell'ecosistema DevKernelPulse, il modulo di protezione **Pulse Sentinel AI** si evolve in un sistema euristico integrato a micro-latenza. In questo articolo esploriamo l'architettura interna di Sentinel, il sistema di streaming della telemetria via **Server-Sent Events (SSE)** e le strategie di blocco proattivo sincronizzate su **Neon PostgreSQL**.\n\n---\n\n## 🔬 1. Oltre le Firme Statiche: L'Approccio Euristico\n\nA differenza dei WAF convenzionali che confrontano le richieste incoming contro una lista rigida di espressioni regolari (regex), Pulse Sentinel AI analizza ogni pacchetto HTTP/S attraverso un **punteggio di minaccia progressivo** (*Threat Index Score*).\n\n```Schema\nRichiesta HTTP/S Incoming\n│\n▼\n┌───────────────────────┐\n│ 1. IP Whitelist Check │ ──[IP in Lista Bianca]──► ✅ Bypass Immediato\n└───────────┬───────────┘\n│ [IP Non in Whitelist]\n▼\n┌───────────────────────┐\n│ 2. Heuristic Engine   │ ──► Structural Payload Inspection\n│    & Pattern Matching │ ──► Rate & Anomaly Detection\n└───────────┬───────────┘ ──► Header & User-Agent Profiling\n│\n▼\n┌───────────────────────┐\n│ 3. Threat Score Calc  │\n└───────────┬───────────┘\n├───────────────────────────────┐\n▼                               ▼\nScore < Threshold               Score >= Threshold\n│                               │\n▼                               ▼\n✅ Passa al Gateway              ⛔ HTTP 403 / IP Auto-Ban\n│\n▼\n📢 Webhook Alerting & SSE Stream\n```\n\n### Vettori di Analisi Euristica Evaluati\n1. **Payload Structural Anomaly**: Identificazione di tentativi di SQL Injection (SQLi), Cross-Site Scripting (XSS), Path Traversal e Command Injection all'interno di parametri `query`, `body` e `headers`.\n2. **Behavioral Rate Anomaly**: Monitoraggio della frequenza di richieste per singola matrice IP/User-Agent. Picchi anomali di richieste a rotte sensibili (es. `/api/v1/auth`, `/admin`, `/docs`) innescano immediatamente penalizzazioni dinamiche.\n3. **Botnet & Scanner Fingerprinting**: Analisi euristica degli header `User-Agent`, `Accept-Language` e sequenze di handshake per identificare tool di scansione automatizzati (es. Nmap, SQLmap, Nikto) mascherati da browser regolari.\n\n---\n\n## 📡 2. Telemetria in Tempo Reale tramite Server-Sent Events (SSE)\n\nPer consentire al **Control Center Admin** di visualizzare gli eventi di sicurezza senza il sovraccarico di connessioni WebSocket bidirezionali, Pulse Sentinel AI adotta un'architettura basata su **Server-Sent Events (SSE)** guidata dal motore Nitro/H3.\n```Ts\nimport { defineEventHandler, createEventStream } from 'h3'\n\nexport default defineEventHandler(async (event) => {\n  // Inizializzazione dello stream SSE persistente\n  const eventStream = createEventStream(event)\n\n  // Sottoscrizione al bus eventi di Sentinel AI\n  const unsubscribe = sentinelEventBus.subscribe((threatEvent) => {\n    eventStream.push({\n      event: 'threat-detected',\n      data: JSON.stringify({\n        timestamp: new Date().toISOString(),\n        ip: threatEvent.ipAddress,\n        threatType: threatEvent.type,\n        score: threatEvent.score,\n        endpoint: threatEvent.endpoint,\n        action: threatEvent.actionTaken\n      })\n    })\n  })\n\n  // Cleanup alla chiusura della connessione client\n  eventStream.onClosed(async () => {\n    unsubscribe()\n  })\n\n  return eventStream.send()\n})\n```\nGrazie a questo approccio, la dashboard dell'amministratore riceve un flusso di telemetria istantaneo a consumo energetico e di banda minimo, permettendo la visualizzazione in streaming del terminale di sicurezza.\n\n## 🔒 3. Persistenza della Blacklist su Neon DB & Auto-Defend AI\n\nQuando la modalità Auto-Defend AI è attiva, Sentinel risponde alle minacce critiche (Threat Score > 80%) eseguendo un ban permanente dell'indirizzo IP responsabile. La persistenza è affidata alla tabella `sentinel_blacklist` del database serverless Neon PostgreSQL.\n\n### Schema della Blacklist (`server/db/schema.ts`)\n\n```Ts\nexport const sentinelBlacklist = pgTable('sentinel_blacklist', {\n  id: serial('id').primaryKey(),\n  ipAddress: varchar('ip_address', { length: 45 }).notNull().unique(),\n  reason: text('reason').notNull(),\n  threatScore: integer('threat_score').default(100).notNull(),\n  bannedBy: varchar('banned_by', { length: 50 }).default('Sentinel-AI'),\n  createdAt: timestamp('created_at').defaultNow().notNull()\n})\n```\n### Logica del Middleware di Blocco\n\nOgni richiesta entrante sul cluster viene verificata contro la memoria in-cache della blacklist. Se l'IP risulta bannato, l'esecuzione della richiesta viene interrotta all'istante all'ingresso del layer middleware, azzerando l'impatto sui servizi a monte.\n\n## 🚨 4. Multi-Channel Instant Alerting System\n\nQuando il `Global Threat Index` supera la soglia di guardia del 50% o quando viene eseguito un ban di emergenza, Sentinel invia notifiche push asincrone e non-bloccanti attraverso **Webhook** dedicati su Telegram e Discord.\n\n```Ts\n// server/utils/alerting.ts\nexport async function sendAdminAlert(payload: AlertPayload) {\n  const discordWebhookUrl = process.env.DISCORD_ADMIN_WEBHOOK_URL\n  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN\n  const telegramChatId = process.env.TELEGRAM_ADMIN_CHAT_ID\n\n  // Dispatch parallelo non-bloccante via fetch\n  Promise.allSettled([\n    discordWebhookUrl && sendDiscordEmbed(discordWebhookUrl, payload),\n    telegramBotToken && telegramChatId && sendTelegramMessage(telegramBotToken, telegramChatId, payload)\n  ])\n}\n```\nQuesto meccanismo garantisce che il team di sicurezza sia informato in tempo reale su qualsiasi tentativo di intrusione, anche quando scollegato dal pannello di controllo Web.\n\n## 📊 5. Performance & Overhead Benchmarking\n\nUno dei vincoli principali nella progettazione di **Pulse Sentinel AI v2.5** è stato l'impatto prestazionale. Il controllo euristico deve essere eseguito su ogni richiesta HTTP senza introdurre latenze avvertibili per gli utenti legittimi.\n\n\n| ==Metrica== | ==WAF Tradizionale== | ==Pulse Sentinel AI v2.5== |\n|---|---|---|\n| **Overhead Medio Middleware** | ~ 15-25 ms | < 1.8 ms |\n| **Consumo Memoria Cache IP** | Elevato (Redis) | Minimo (In-Memory LRU + DB Async) |\n| **MetricaWAF** | 1 - 5 minuti | Istantaneo (< 50 ms) |\n| **Falsi Positivi su Runner CI/CD** | Frequenti | 0% (grazie a IP Whitelist Manager) |\n\n---\n\n## 🔮 6. Roadmap di Sicurezza v3.0\n\nL'evoluzione di Pulse Sentinel AI non si ferma alla v2.5. \n\n==La roadmap per il 2027 prevede==:\n- **Canary & Honeypot Traps**: Rotte esca non documentate per identificare e bannare istantaneamente gli spider malevoli al primo tentativo di ricognizione.\n- **WASM Isolated Sandbox**: Esecuzione dell'ispezione avanzata di payload complessi all'interno di un sandbox WebAssembly ad altissima velocità.\n\n***DevKernelPulse Security Lab — 2026***\n\n\n\n	Un'analisi approfondita su Pulse Sentinel AI v2.5: come funziona il motore di analisi euristica in tempo reale, lo streaming di telemetria via Server-Sent Events (SSE), la mitigazione automatica dei vettori d'attacco e le notifiche push via Webhook.	7	22	43	published	t	DKP-VAULT-CERT-ADMIN-N76JCX	8f28af58e9c040e5c8cc8ae67d2205f1f4c5a8cbfd275a8c06f61e4b00c98e7a	3	1	2026-10-20 17:08:40.557504	2026-10-20 17:08:40.557504	["Pulse Sentinel AI", "WAF", "Heuristic Firewall", "SSE", "Cybersecurity", "Threat Stream", "GCP Cloud Run", "v2.5-GOLD", "Nuxt 4", "Nitro Engine", "Server-Sent Events (SSE)", "H3 Event Handlers", "Neon PostgreSQL", "Drizzle ORM", "Discord/Telegram Webhooks", "GCP Cloud Armor"]
44	Da sviluppatore a tech lead: responsabilità, competenze e primi passi	da-sviluppatore-a-tech-lead-responsabilit-competenze-e-primi-passi	## Introduzione\n\nPassare da sviluppatore a **tech lead** è un salto di responsabilità che richiede non solo competenze tecniche più ampie, ma anche capacità di leadership, comunicazione e gestione del contesto di prodotto. Questo articolo tecnico‑pratico descrive **cosa cambia** nel ruolo, **quali competenze sviluppare**, e fornisce una roadmap operativa per i **primi 30–90 giorni** nel nuovo ruolo. Troverai checklist, esempi di attività quotidiane e suggerimenti concreti per crescere in modo sostenibile e misurabile.\n\n## 1. Che cosa fa un tech lead: responsabilità chiave\n\nUn tech lead è il punto di riferimento tecnico del team e svolge funzioni che si collocano tra l’ingegneria individuale e la leadership tecnica. Le responsabilità tipiche includono:\n- **Direzione tecnica**: definire e far rispettare scelte architetturali, pattern e standard di qualità.\n- **Design e review**: guidare design review, code review e decisioni su trade‑off architetturali.\n- **Mentorship**: supportare la crescita dei membri del team con feedback, pair programming e piani di sviluppo.\n- **Coordinamento con stakeholder**: tradurre requisiti di prodotto in soluzioni tecniche e comunicare rischi/tempi.\n- **Operational excellence**: garantire affidabilità, osservabilità, runbooks e processi di incident response.\n- **Delivery**: aiutare a pianificare sprint, rimuovere impedimenti tecnici e migliorare il flow di delivery.\n\nQueste responsabilità richiedono equilibrio tra contributo hands‑on e attività di coordinamento: un tech lead efficace sa quando scrivere codice e quando abilitare altri a farlo.\n\n## 2. Competenze tecniche essenziali\n\nUn tech lead non deve essere l’esperto assoluto in tutto, ma deve possedere una **visione tecnica ampia** e competenze pratiche in aree critiche:\n\n- **Architettura software**: progettazione di sistemi scalabili, pattern (CQRS, event sourcing, hexagonal), trade‑off tra coerenza e disponibilità.\n- **Testing e qualità**: strategie di testing (unit, integration, contract, e2e), TDD/BDD e testability del codice.\n- **DevOps e CI/CD**: pipeline, automazione, infrastruttura come codice (Terraform/CloudFormation), gestione dei rilasci e rollback.\n- **Observability**: logging strutturato, metriche, tracing distribuito e alerting (SLO/SLI/SLA).\n- **Performance e scalabilità**: profiling, caching, sharding, capacity planning.\n- **Sicurezza**: threat modeling, gestione dei segreti, hardening e compliance di base.\n\nQueste competenze permettono al tech lead di valutare soluzioni, definire standard e guidare decisioni tecniche con consapevolezza dei rischi.\n\n## 3. Competenze “soft” e di leadership\n\nLe soft skills sono spesso il fattore discriminante nella transizione:\n- **Comunicazione chiara**: saper spiegare scelte tecniche a colleghi non tecnici e documentare decisioni.\n- **Mentorship e coaching**: dare feedback costruttivi, impostare obiettivi di crescita e delegare responsabilità.\n- **Decision making**: prendere decisioni tempestive basate su dati, esperienza e trade‑off.\n- **Gestione dei conflitti**: facilitare discussioni tecniche e trovare compromessi sostenibili.\n- **Prioritizzazione**: bilanciare qualità tecnica, velocità di delivery e rischi di business.\n- **Empatia e inclusione**: creare un ambiente dove il team può sperimentare e fallire in sicurezza.\n\nInvestire in queste competenze aumenta la capacità del tech lead di moltiplicare l’efficacia del team.\n\n## 4. I primi 30 giorni: ascoltare, mappare, capire\n\nNei primi 30 giorni l’obiettivo è ridurre l’incertezza e costruire credibilità:\n- **Onboarding tecnico**: esegui il setup locale, esamina l’architettura, i diagrammi, i runbooks e i principali repository.\n- **Ascolto attivo**: incontra i membri del team, product manager, SRE e stakeholder; raccogli punti di vista su problemi e priorità.\n- **Mappatura del debito tecnico**: identifica hot spots, code smells, test coverage e aree a rischio.\n- **Osservabilità**: verifica dashboard, alert e runbooks; assicurati che gli incidenti recenti siano documentati.\n- **Quick wins**: risolvi piccoli impedimenti che migliorano il flusso (es. script, permessi, CI flakey).\n\nQueste attività costruiscono fiducia e ti danno il contesto necessario per decisioni successive.\n\n## 5. Giorni 30–90: definire direzione e iniziare cambiamenti\n\nDopo il periodo iniziale, il focus si sposta su **prioritizzazione** e **abilitazione**:\n- **Roadmap tecnica**: definisci obiettivi a 3–6 mesi (riduzione del debito, miglioramento SLO, refactor mirati).\n- **Standard e convenzioni**: formalizza linee guida per code style, testing, branching e release.\n- **Mentorship strutturata**: avvia 1:1 regolari, piani di crescita e sessioni di pair programming.\n- **Migliorare il delivery**: ottimizza pipeline CI/CD, riduci tempi di build/test e automatizza rollback.\n- **Incident management**: esercita runbook, postmortem senza colpe e azioni correttive tracciabili.\n- **Delegare e scalare responsabilità**: identifica tech leads emergenti e distribuisci ownership.\n\nMisura l’impatto con metriche: lead time for changes, MTTR, test coverage, numero di incidenti ricorrenti.\n\n## 6. Strumenti e pratiche consigliate\n- **Code review**: regole chiare (dimensione PR, checklist, tempo massimo di review).\n- **CI/CD**: pipeline veloci e affidabili; test paralleli e caching.\n- **Feature flags**: deploy continuo con rollout controllato.\n- **Documentazione viva**: architettura, decision records (ADR), runbooks e onboarding.\n- **Postmortem culture**: template per incident report e azioni correttive.\n- **Metriche e dashboard**: SLO/SLI, error budget, deploy frequency.\n\nQuesti strumenti trasformano pratiche individuali in processi ripetibili.\n\n## 7. Come misurare il successo di un tech lead\n\nIndicatori utili (KPI qualitativi e quantitativi):\n- **Lead time for changes** (tempo medio dal commit al deploy).\n- **MTTR** (Mean Time To Recovery) per incidenti.\n- **Test coverage e qualità del codice** (trend nel tempo).\n- **Soddisfazione del team** (survey 1:1, retention).\n- **Numero di decisioni tecniche documentate** (ADR).\n- **Velocità di onboarding** per nuovi membri.\n\nUsa questi indicatori per guidare miglioramenti e per valutare l’efficacia delle iniziative tecniche.\n\n## 8. Errori comuni da evitare\n- **Fare tutto da solo**: il tech lead non è il “tuttofare”; delega e abilita il team.\n- **Ignorare il contesto di prodotto**: le scelte tecniche devono supportare obiettivi di business.\n- **Eccessiva perfezione**: evitare refactor estesi senza valore misurabile; preferire iterazioni.\n- **Non documentare**: decisioni non documentate diventano debito cognitivo.\n- **Confondere autorità con leadership**: leadership si guadagna con fiducia e risultati, non con imposizioni.\n\n## 9. Piano di crescita personale (6–12 mesi)\n- **Mese 0–3**: consolidare onboarding, ascolto, quick wins, definire roadmap tecnica.\n- **Mese 3–6**: implementare standard, migliorare CI/CD, avviare mentorship strutturata.\n- **Mese 6–12**: guidare iniziative architetturali, sviluppare altri leader tecnici, misurare impatto con KPI\n\nFormazione continua: libri su leadership tecnica, corsi su comunicazione e coaching, partecipazione a conferenze e community.\n\n## 10. Risorse pratiche e letture consigliate\n- Articoli e guide su leadership tecnica e code review best practices.\n- Libri su management tecnico e comunicazione (es. testi su mentoring, feedback e decision making).\n- Template ADR, checklist per code review e template per postmortem.\n\n## 11. Risorse pratiche disponibili  \n\nPer aiutarti nella transizione da sviluppatore a tech lead ho preparato una serie di risorse pratiche che puoi integrare subito nel tuo workflow:\n- **Checklist per i primi 90 giorni** — onboarding operativo con incontri chiave, quick wins e metriche da monitorare.\n- **Template pratici** — esempi pronti di ADR (Architecture Decision Record), runbook operativi, \ntemplate per postmortem e checklist per code review.\n- **Piano di formazione personalizzato** — roadmap di crescita tecnica e di leadership su 6–12 mesi, con milestone e risorse consigliate.\n\nTutti i materiali sono forniti in formato Markdown e pronti da **copiare/incollare** nel repository del tuo team o nella tua documentazione interna, e adattare i contenuti al tuo contesto (tech stack, dimensione del team, priorità aziendali) e generare versioni pronte per Storybook, wiki o repository Git.\n\n\n### 1 — Checklist per i primi 90 giorni (sintesi e struttura)\n**Obiettivo**: ridurre l’incertezza, creare credibilità e abilitare il team.\n\n==**Struttura della checklist**==\n\n**Giorni 0–7: Setup e ascolto**\n- Configurare ambiente locale e accessi (repo, CI, dashboard).\n- Leggere architettura, ADR esistenti, runbook e incident report recenti.\n- 1:1 con ogni membro del team (obiettivi, frustrazioni, aspettative).\n- Quick win: risolvere un impedimento operativo (CI flakey, permessi).\n**Giorni 8–30: mappatura e priorità**\n- Inventario del debito tecnico e delle aree a rischio.\n- Verifica osservabilità: dashboard, alert, SLO/SLI.\n- Stabilire 3 obiettivi tecnici a 90 giorni (es. ridurre MTTR, aumentare coverage).\n- Eseguire almeno un piccolo refactor con pair programming.\n**Giorni 31–60: definizione e abilitazione**\n- Formalizzare standard (code style, PR size, testing policy).\n- Introdurre o migliorare pipeline CI/CD (parallelizzazione, caching).\n- Avviare mentorship strutturata (1:1 regolari, piani di crescita).\n- Eseguire un tabletop incident drill e aggiornare runbook.\n**Giorni 61–90: consolidamento e misurazione**\n- Misurare KPI: lead time for changes, MTTR, deploy frequency.\n- Documentare decisioni architetturali (ADR) per le scelte fatte.\n- Delegare ownership su componenti chiave a membri del team.\n- Presentare risultati e next steps allo stakeholder product/engineering.\n\n### 2 — Template pratici (snippet e uso)\n\n==A. ADR (Architecture Decision Record) — template breve==\n\n```markdown\n# ADR 001 — Titolo della decisione\n- **Data:** 2026-10-17\n- **Status:** Proposed / Accepted / Deprecated\n- **Contesto:** (breve descrizione del problema)\n- **Decisione:** (cosa si è deciso)\n- **Motivazione:** (trade-off, alternative considerate)\n- **Impatto:** (cosa cambia, migration plan)\n- **Autore:** Nome\n```\n==B. Runbook operativo (incident quick reference)==\n\n```markdown\n# Runbook: Service X - Incident Response\n## Sintomi\n- Errori 5xx > 5% in 5m\n- Latency p95 > 2s\n\n## Azioni immediate\n1. Verificare dashboard: grafici error rate, latency, CPU, mem.\n2. Controllare log recenti (last 15m) per stacktrace.\n3. Se deploy recente: rollback al tag stabile.\n4. Se DB lock: eseguire query diagnostiche e isolare query lente.\n\n## Escalation\n- On-call SRE: @nome\n- Tech lead: @nome\n- Tempo massimo per escalation: 15 minuti\n```\n==C. Postmortem template (no-blame)==\n\n```markdown\n# Postmortem: [Titolo incidente] - YYYY-MM-DD\n- **Summary:** breve descrizione\n- **Timeline:** eventi cronologici\n- **Root cause:** analisi tecnica\n- **Impact:** utenti, business, durata\n- **Mitigations:** azioni immediate\n- **Long term fixes:** task e owner\n- **Follow-up:** date e responsabili\n```\n==D. Checklist code review==\n- PR size < 400 LOC\n- Test coverage per feature aggiunta\n- Documentazione aggiornata (README, ADR)\n- Performance considerations verificate\n- Security checks (input validation, secrets)\n- Changelog/Release notes aggiornati\n\n### 3 — Piano di formazione personalizzato (roadmap 6–12 mesi)\n\n**Obiettivo**: sviluppare competenze tecniche e di leadership misurabili.\n\n==Struttura consigliata==\n\n**Mese 0–3: Fondamenta**\n- **Argomenti**: architettura dei sistemi, testing avanzato, CI/CD best practices.\n- **Attività**: 4 workshop interni (2h ciascuno), 1 progetto di refactor guidato, 1:1 settimanali.\n**Mese 3–6: Operatività e osservabilità**\n- **Argomenti**: SLO/SLI, tracing distribuito, incident response, performance tuning.\n- **Attività**: esercitazioni di incident simulation, implementazione di dashboard e alert, corso su tracing.\n**Mese 6–12: Leadership tecnica**\n- **Argomenti**: decision making architetturale, mentoring, gestione del cambiamento.\n- **Attività**: mentoring formale per 1–2 membri, partecipazione a design review cross-team, letture guidate e presentazioni interne.\n\n==Risorse consigliate==\n\n- Corsi online (architettura, SRE, leadership tecnica).\n- Libri selezionati su design system, incident management e coaching.\n- Sessioni di pair programming e code review strutturate.\n- \n==Deliverable attesi==\n\n- Piano di crescita individuale per ogni mentee.\n- 3 ADR documentate e approvate.\n- Riduzione MTTR del X% e miglioramento lead time del Y% in 6 mesi.\n\n## Conclusione\n\nLa transizione da sviluppatore a tech lead è una progressione che richiede **equilibrio tra competenze tecniche e capacità relazionali**. I primi mesi sono fondamentali per costruire credibilità: ascolta, mappa il contesto, risolvi impedimenti e poi guida cambiamenti misurabili. Un tech lead di successo non è chi sa fare tutto meglio degli altri, ma chi rende il team più efficace, resiliente e autonomo.\n\n\n	Guida pratica e tecnica per la transizione da sviluppatore a tech lead: responsabilità quotidiane, competenze chiave (tecniche e soft), attività prioritarie nei primi 90 giorni e roadmap di crescita.	19	311	1	published	t	DKP-VAULT-CERT-ADMIN-UHTU9Q	12ee73f0de32799952b9a92f9eaeae0d3abfa82d56170096ca9d42a5b1316e8d	18	2	2026-10-17 06:59:14.180953	2026-10-17 06:59:14.180953	["Tech Lead", "Leadership", "Career", "Software Architecture", "Team Management", "Mentorship", "Communication", "DevOps", "CI/CD", "Cloud Platform", "AWS/GCP/Azure", "Kubernetes", "Observability", "Testing e Quality", "Agile/Scrum"]
50	Open Source + SaaS Ibrido: Perché questo Modello rappresenta il Futuro delle Dev Tools	open-source-saas-ibrido-perch-questo-modello-rappresenta-il-futuro-delle-dev-tools	# Open Source + SaaS Ibrido: Perché questo Modello rappresenta il Futuro delle Dev Tools\n\nNel panorama del moderno software engineering, il modello di distribuzione delle developer tools (Dev Tools) ha vissuto una trasformazione profonda. Siamo passati dai software commerciali "scatola chiusa" (proprietari e non ispezionabili) all'esplosione dell'Open Source puro, fino a raggiungere l'attuale standard industriale: il **modello ibrido Open-SaaS** (*Commercial Open Source Software - COSS*).\n\nCon la release **v2.5-GOLD**, l'ecosistema **DevKernelPulse (DKP)** adotta pienamente questo paradigma. In questo articolo analizziamo i motivi strategici ed architetturali per cui il modello ibrido rappresenta la scelta vincente per sviluppatori, community e aziende software.\n\n---\n\n## ⚖️ 1. Il Dilemma delle Dev Tools: Trasparenza vs Sostenibilità\n\nPer anni gli sviluppatori si sono trovati di fronte a una scelta dicotomica:\n\n1. **Software Open Source Puro**: Massima trasparenza, nessun lock-in, controllabilità completa del codice, ma spesso penalizzato da scarso supporto finanziario a lungo termine, hosting complesso da gestire in autonomia e aggiornamenti discontinui.\n2. **SaaS Proprietario / Chiuso**: Praticità del "pronto all'uso" e infrastruttura gestita dal vendor, ma a prezzo della perdita di trasparenza, dipendenza da API proprietarie e rischi legati alla privacy e alla sicurezza del codice sorgente.\n\n### La Soluzione: Il Modello Ibrido Open-SaaS\nIl paradigma Open-SaaS supera questo vincolo combinando un **Core Open Source ispezionabile e self-hostable** con una suite di **Servizi Cloud Gestiti / API Gateway commerciali** dedicati a chi desidera alte prestazioni, zero manutenzione infrastrutturale e SLA di livello Enterprise.\n\n\n```Schema\n                       ┌────────────────────────────────────────┐\n                       │      DevKernelPulse Ecosystem          │\n                       └───────────────────┬────────────────────┘\n                                           │\n                  ┌────────────────────────┴────────────────────────┐\n                  ▼                                                 ▼\n ┌────────────────────────────────┐                ┌────────────────────────────────┐\n │      OPEN SOURCE CORE          │                │      COMMERCIAL CLOUD SAAS     │\n ├────────────────────────────────┤                ├────────────────────────────────┤\n │ • CLI Toolkit                  │                │ • Managed API Gateway          │\n │ • Local SAST Scanner           │                │ • Global Threat Index (GCP)    │\n │ • Local Proof-of-Code Hasher   │                │ • Pulse Sentinel AI WAF        │\n │ • Documentation & Standards    │                │ • Managed Vault & Cloud Store  │\n └────────────────────────────────┘                └────────────────────────────────┘\n```\n\n---\n\n## 🏗️ 2. L'Architettura Ibrida di DevKernelPulse\n\nIn DevKernelPulse v2.5-GOLD, la separazione tra il livello locale e la piattaforma gestita è definita da confini architetturali netti.\n\n### A. Il Layer Locale (Open Source Core)\nQualsiasi sviluppatore può utilizzare la **DKP CLI** e i moduli locali per eseguire audit di codice, generare hash di notarizzazione SHA-256 e analizzare dipendenze sul proprio sistema senza inviare dati all'esterno o stipulare abbonamenti.\n\n* **Audit Locale Offline**: Esecuzione di regole SAST/AST a costo zero ed in totale riservatezza.\n* **Ispezionabilità del Codice**: Zero "magia nera" o algoritmi nascosti. La trasparenza garantisce la fiducia della community di sviluppatori e ricercatori di sicurezza.\n\n### B. Il Layer Gestito (Commercial Cloud Gateway)\nPer le aziende e i team che necessitano di sincronizzazione in tempo reale, telemetria avanzata, supporto multi-regione e rate limiting elevato, DKP fornisce l'infrastruttura gestita su **Google Cloud Run (`europe-west4`)** e **Neon PostgreSQL Serverless**.\n\n```Ts\n// server/middleware/apiGateway.ts\n// Esempio: Autenticazione ad alta sicurezza tramite scrypt KDF sul Cloud Managed Gateway\nimport { scryptSync } from 'node:crypto'\nimport { eq } from 'drizzle-orm'\nimport { getDb } from '~~/server/utils/db'\nimport { apiKeys } from '~~/server/db/schema'\n\nexport default defineEventHandler(async (event) => {\n  // Il gateway gestisce il Rate Limiting, il logging asincrono \n  // e la validazione delle credenziali dei piani FREE, PRO ed ENTERPRISE.\n})\n```\n## 💡 3. I Vantaggi per lo Sviluppatore e l'Azienda\n\n### 1. Zero Vendor Lock-in\nSe un'azienda decide di migrare dalla versione gestita Cloud ad una propria infrastruttura On-Premise, il codice sorgente e la logica di notarizzazione rimangono identici. Non ci sono formati dati proprietari o barriere all'uscita.\n\n### 2. Sicurezza e Audit della Community\nEssendo le componenti chiave pubbliche e trasparenti, la community di security researcher verifica costantemente il codice. Vulnerabilità come quelle identificate da CodeQL vengono rilevate e risolte in tempi infinitamente più rapidi rispetto al software proprietario.\n\n### 3. Sostenibilità Finanziaria e R&D\nI proventi generati dai piani commerciali del SaaS (SaaS Store, API Keys PRO/Enterprise) finanziano direttamente lo sviluppo continuo del Core Open Source, creando un cerchio virtuoso di innovazione sostenibile.\n\n## 📊 4. Confronto tra Modelli Software\n\n| ==Caratteristica== | ==Software Proprietario== | ==Open Source Puro== | ==Modello Ibrido DKP (Open-SaaS)== |\n|---|---|---|\n| **Ispezionabilità Codice** | ❌ Assente | ✅ 100% Libera | ✅ 100% Libera |\n| **Hosting e Gestione** | Managed dal Vendor | ❌ Totalmente Self-Hosted | ⚡ Scelta Flessibile (Self-Host o Cloud) |\n| **Manutenzione & SLA** | Garantita | ❌ A carico dell'utente | ✅ Garantita sul Cloud Managed |\n| **Sicurezza & Audit** | Black Box | Community | ✅ Hybrid (Audit + WAF Managed) |\n| **Costo d'Ingresso** | Elevato | Gratuito | 🆓 Freemium / Trasparente |\n\n\n---\n\n## 🔮 5. La Visione DKP per il 2027\n\nDevKernelPulse dimostra che il futuro delle Dev Tools non è scegliere tra ideologia e praticità commerciale, ma unire il meglio di entrambi i mondi.\n\n==La nostra roadmap 2026-2027 estenderà ulteriormente questo modello==:\n- **SDK Pubblico** (`@devkernelpulse/sdk`): Libreria npm per consentire a sviluppatori terzi di integrare i servizi DKP nei propri progetti.\n- **Smart Contract Settlement**: Integrazione opzionale Web3 per remunerare in modo trasparente i contributori Open Source al merge delle loro Pull Request.\n\n***DevKernelPulse Tech Strategy — 2026***\n	Un'analisi strategica ed architetturale sul modello ibrido Open Source + SaaS Commerciale: come DevKernelPulse concilia la trasparenza del codice sorgente con servizi cloud gestiti, API Gateway ad alta disponibilità e monetizzazione sostenibile per le developer tools.	7	114	44	published	t	DKP-VAULT-CERT-ADMIN-S7XCD5	349c28571b22cafe6f90af4ebc53ba63a5808134747940dfb36a3dcfc5aea649	1	1	2026-10-20 17:50:04.966475	2026-10-20 17:50:04.966475	["Open Source", "SaaS", "Developer Tools", "Business Model", "DevKernelPulse", "API Gateway", "Architecture", "v2.5-GOLD", "Nuxt 4", "Nitro Engine", "Open Source Core", "SaaS API Gateway", "Neon PostgreSQL", "scrypt KDF", "GCP Cloud Run"]
51	TypeScript per chi conosce JavaScript: tipi, interfacce e primi passi	typescript-per-chi-conosce-javascript-tipi-interfacce-e-primi-passi	## Introduzione\n\nSe utilizzi già JavaScript, imparare **TypeScript** è probabilmente uno degli investimenti più utili che puoi fare come sviluppatore. TypeScript non sostituisce JavaScript: lo estende aggiungendo un sistema di tipi statici che aiuta a individuare errori prima dell'esecuzione, migliora l'autocompletamento degli editor e rende il codice più facile da mantenere nei progetti di grandi dimensioni.\n\nNegli ultimi anni TypeScript è diventato lo standard de facto per framework moderni come Angular, Next.js, **Nuxt**, NestJS e molti progetti React e **Vue**. Conoscere TypeScript oggi significa scrivere applicazioni più affidabili e collaborare efficacemente in team di sviluppo professionali.\n\nIn questa guida vedremo i concetti fondamentali che ogni sviluppatore JavaScript dovrebbe padroneggiare per iniziare il passaggio a TypeScript.\n\n## Perché TypeScript?\n\nIn JavaScript, molti errori emergono soltanto durante l'esecuzione.\n\nEsempio:\n\n```Js\nfunction somma(a, b) {\n  return a + b;\n}\n\nsomma(10, "20");\n```\nIl risultato sarà:\n\n```Js\n"1020"\n```\nDal punto di vista di JavaScript non c'è alcun errore.\n\nCon TypeScript possiamo definire i tipi:\n\n```Ts\nfunction somma(a: number, b: number): number {\n  return a + b;\n}\n\nsomma(10, "20");\n```\nIl compilatore segnalerà immediatamente:\n\n```Codice\nArgument of type 'string' is not assignable to parameter of type 'number'\n```\nQuesto approccio riduce bug, refactoring rischiosi e problemi in produzione.\n\n## Installazione e configurazione\n\nCreare un nuovo progetto TypeScript è semplice.\n\n### Installazione globale\n\n```Shell\nnpm install -g typescript\n```\nVerifica:\n\n```Shell\ntsc --version\n```\n### Creazione di un progetto\n\n```Shell\nmkdir ts-demo\ncd ts-demo\n\nnpm init -y\n\nnpm install typescript --save-dev\n```\nGenera il file di configurazione:\n\n```Shell\nnpx tsc --init\n```\nVerrà creato:\n\n```Codice\ntsconfig.json\n```\nche controlla il comportamento del compilatore.\n\n## Il file tsconfig.json\n\nConfigurazione minima consigliata:\n\n```Json\n{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "ESNext",\n    "strict": true,\n    "outDir": "./dist",\n    "rootDir": "./src"\n  }\n}\n```\nOpzioni importanti:\n\n| ==Opzione== | ==Descrizione== |\n|---|---|\n| **strict** | Abilita controlli rigorosi |\n| **target** | Versione JavaScript generata |\n| **module** | Sistema dei moduli |\n| **rootDir** | Cartella sorgente |\n| **outDir** | Cartella output |\n\nPer nuovi progetti è consigliato mantenere sempre:\n\n```Json\n"strict": true\n```\n\n## Tipi primitivi\n\nTypeScript introduce l'annotazione dei tipi.\n\n### String\n\n```Ts\nlet username: string = "Marco";\n```\n### Number\n\n```Ts\nlet age: number = 30;\n```\n### Boolean\n\n```Ts\nlet active: boolean = true;\n```\n### Array\n\n```Ts\nlet tags: string[] = [\n  "typescript",\n  "javascript",\n  "web"\n];\n```\nOppure:\n\n```Ts\nlet tags: Array<string>;\n```\n\n## Type inference\n\nSpesso non è necessario dichiarare il tipo.\n\n```Ts\nlet city = "Torino";\n```\nTypeScript deduce automaticamente:\n\n```Ts\nstring\n```\nQuesto meccanismo è chiamato **Type Inference**.\n\nÈ una delle caratteristiche più apprezzate perché riduce il codice mantenendo la sicurezza dei tipi.\n\n## Oggetti tipizzati\n\nIn JavaScript gli oggetti sono dinamici.\n\nIn TypeScript possiamo descriverne la struttura.\n\n```Ts\nconst user: {\n  name: string;\n  age: number;\n} = {\n  name: "Marco",\n  age: 35\n};\n```\nSe manca una proprietà o il tipo è errato, il compilatore segnala il problema.\n\n## Le interfacce\n\nLe interface permettono di definire contratti riutilizzabili.\n\n```Ts\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n}\n```\nUso:\n\n```Ts\nconst user: User = {\n  id: 1,\n  name: "Marco",\n  email: "email@example.com"\n};\n```\n### Proprietà opzionali\n\n```Ts\ninterface User {\n  id: number;\n  name: string;\n  avatar?: string;\n}\n```\nL'operatore ? rende il campo facoltativo.\n\n### Proprietà readonly\n\n```Ts\ninterface User {\n  readonly id: number;\n  name: string;\n}\n```\nNon sarà possibile modificare l'ID dopo la creazione.\n\n## Type Alias\n\nAlternativa alle interface.\n\n```Ts\ntype User = {\n  id: number;\n  name: string;\n};\n```\nEntrambi gli approcci sono validi.\n\nRegola pratica:\n- **Interface** → modelli applicativi\n- **Type** → unioni, utility e composizioni\n\n## Union Types\n\nPermettono più tipi possibili.\n\n```Ts\nlet id: string | number;\n\nid = 10;\nid = "abc";\n```\nMolto utili nelle API e nei parametri opzionali.\n\n## Literal Types\n\nPossiamo limitare i valori ammessi.\n\n```Ts\ntype Status =\n  | "pending"\n  | "completed"\n  | "failed";\n```\nUso:\n\n```Ts\nlet stato: Status = "completed";\n```\n\n## Funzioni tipizzate\n\nJavaScript:\n\n```Js\nfunction greet(name) {\n  return `Hello ${name}`;\n}\n```\nTypeScript:\n\n```Ts\nfunction greet(name: string): string {\n  return `Hello ${name}`;\n}\n```\nFunzioni anonime:\n\n```Ts\nconst sum = (\n  a: number,\n  b: number\n): number => {\n  return a + b;\n};\n```\n\n## Generics\n\nI generics permettono di creare codice riutilizzabile e type-safe.\n\nEsempio:\n\n```Ts\nfunction identity<T>(value: T): T {\n  return value;\n}\n```\nUtilizzo:\n\n```Ts\nidentity<string>("ciao");\n\nidentity<number>(42);\n```\nTypeScript manterrà sempre il tipo corretto.\n\n## Generics con array\n\n```Ts\nfunction first<T>(\n  items: T[]\n): T {\n  return items[0];\n}\n```\nEsempio:\n\n```Ts\nconst value = first([\n  "Vue",\n  "React",\n  "Angular"\n]);\n```\nIl tipo inferito sarà:\n```Ts\nstring\n```\n## Enum\n\nLe enum raggruppano costanti correlate.\n\n```Ts\nenum Role {\n  Admin,\n  User,\n  Guest\n}\n```\nUtilizzo:\n\n```Ts\nconst role = Role.Admin;\n```\nMolti team oggi preferiscono:\n\n```Ts\nconst ROLES = {\n  ADMIN: "admin",\n  USER: "user"\n} as const;\n```\nper via della maggiore compatibilità con JavaScript moderno.\n\n## Null e Undefined\n\nCon modalità strict:\n\n```Ts\nlet username: string;\n```\nnon può essere:\n\n```Ts\nnull\n```\no invece:\n\n```Ts\nundefined\n```\na meno che non venga esplicitato:\n\n```Ts\nlet username:\n  | string\n  | null;\n```\n## Utility Types più utili\n### Partial\n\n```Ts\ninterface User {\n  id: number;\n  name: string;\n}\n```\n\n```Ts\ntype UserUpdate =\n  Partial<User>;\n```\nTutti i campi diventano opzionali.\n\n### Pick\n\n```Ts\ntype UserPreview =\n  Pick<User, "id" | "name">;\n```\n### Omit\n\n```Ts\ntype UserWithoutId =\n  Omit<User, "id">;\n```\nQueste utility sono ampiamente utilizzate in `API REST` e `ORM` moderni.\n\n## TypeScript nel mondo reale\n\nTypeScript è ormai presente in:\n- React\n- Next.js\n- Vue 3\n- Nuxt 4\n- Angular\n- MestJS\n- Express\n- Bun\n- Deno\nAnche molte librerie backend moderne utilizzano TypeScript come linguaggio principale.\n\n## Errori comuni per chi arriva da JavaScript\n### Usare any ovunque\n\n```Ts\nlet data: any;\n```\nEquivale praticamente a rinunciare ai vantaggi di TypeScript.\n\nMeglio:\n\n```Ts\nunknown\n```\nquando il tipo non è noto.\n\n### Ignorare Strict Mode\n\nMolti principianti disattivano:\n\n```Json\n"strict": true\n```\nper eliminare errori.\n\nÈ un errore comune: proprio quei controlli aiutano a scrivere codice più sicuro.\n\n### Tipizzare troppo\n\nNon serve annotare ogni singola variabile:\n\n```Ts\nlet language = "TypeScript";\n```\nè spesso migliore di:\n\n```Ts\nlet language: string = "TypeScript";\n```\ngrazie alla **Type Inference**.\n\n## Roadmap consigliata per imparare TypeScript\n\n### Livello 1\n- Tipi primitivi\n- Function types\n- Interface\n- Type Alias\n- Union Types\n\n### Livello 2\n- Generics\n- Utility Types\n- Narrowing\n- Type Guards\n\n### Livello 3\n- Advanced Generics\n- Conditional Types\n- Mapped Types\n- Declaration Merging\n\n### Livello 4\n- Librerie e framework\n- React / Vue + TypeScript\n- Node.js + TypeScript\n- API type-safe\n\n## Conclusione\n\n**TypeScript** rappresenta l'evoluzione naturale di **JavaScript** per applicazioni moderne. Non cambia il modo in cui scriviamo logica applicativa, ma aggiunge un livello di sicurezza che aiuta a individuare errori prima che raggiungano la produzione.\n\nPer uno sviluppatore **JavaScript**, l'approccio migliore è introdurlo progressivamente: partire dai tipi base, imparare le interfacce e successivamente esplorare `generics` e `utility types`. Dopo poche settimane di utilizzo, tornare a un progetto **JavaScript** di grandi dimensioni senza **TypeScript** può sembrare sorprendentemente limitante.\n\nLa vera forza di **TypeScript** non è scrivere più codice, ma scrivere codice più prevedibile, manutenibile e scalabile, caratteristiche fondamentali in qualsiasi progetto professionale moderno. ❤️\n\n\n\n\n\n\n	Una guida pratica e approfondita per sviluppatori JavaScript che vogliono imparare TypeScript: tipi, interfacce, generics, configurazione del progetto e best practice per scrivere codice più robusto e manutenibile.	9	62	45	published	t	DKP-VAULT-CERT-ADMIN-LVHU61	98c62987e899357cf95fab66544fa005289ce0e3ee82ebba9f2d90823b703e06	1	1	2026-10-21 05:30:06.173416	2026-10-21 05:30:06.173416	["TypeScript", "JavaScript", "Static Typing", "Generics", "Interfaces", "Frontend Development", "Node.js", "Programming", "JavaScript ES2023+", "VS Code", "npm/pnpm", "ts-node", "Vite", "ESLint", "Prettier"]
52	React Native con Expo: creare la prima app multipiattaforma	react-native-con-expo-creare-la-prima-app-multipiattaforma	## Introduzione\n\n**React Native** con **Expo** rappresenta oggi una delle soluzioni più efficienti per sviluppare applicazioni mobile native che funzionino su **iOS** e **Android** mantenendo una base di codice unificata. A differenza degli approcci tradizionali che richiedono competenze separate in `Swift/Objective-C` per **iOS** e `Java/Kotlin` per **Android**, React Native permette ai developer **JavaScript** di creare app mobile performanti e native con un'unica codebase.\n\nIn questo articolo approfondiremo come iniziare con React Native ed Expo, scoprendo gli strumenti, le best practice e i passaggi fondamentali per lanciare la tua prima applicazione multipiattaforma.\n\n## Cosa sono React Native ed Expo?\n\n### React Native\n\n**React Native** è un ==framework open-source== creato da Facebook (ora Meta) che consente di scrivere applicazioni mobile utilizzando React e JavaScript. A differenza di soluzioni **cross-platform** come `Cordova` o `Ionic` che eseguono codice web in un webview, React Native compila il codice JavaScript in componenti nativi reali, garantendo performance identiche alle app native scritte in linguaggi nativi.\n\n### Expo\n\n**Expo** è una piattaforma costruita su React Native che semplifica significativamente lo sviluppo e il deployment. Fornisce:\n- **Un set completo di API** pre-built (fotocamera, geolocalizzazione, notifiche push, storage)\n- **Expo CLI** per lo sviluppo rapido senza configurazione complessa\n- **Expo Go** (app mobile) per testare in tempo reale su device fisici\n- **Integrazione nativa** con servizi cloud per build e distribuzione\n\n## Prerequisiti e Installazione\n\n### Requisiti di sistema\n- **Node.js** (versione 16 o superiore) e `npm` o `yarn`\n- **Un editor di codice** (VSCode consigliato)\n- Un device mobile con **Expo Go** oppure emulatori (`Android Studio/Xcode`)\n\n### Installazione di Expo CLI\n\n```Bash\nnpm install -g expo-cli\n```\nVerifica l'installazione:\n\n```Bash\nexpo --version\n```\n## Creare il primo progetto\n\n### Step 1: Generare il progetto base\n\n```Bash\nexpo create FirstApp\ncd FirstApp\n```\nDurante questo processo Expo chiede il template preferito. Scegli blank per una base minimalista.\n\n### Step 2: Struttura del progetto\n\n```Schema\nFirstApp/\n├── assets/          # Immagini e risorse statiche\n├── App.js          # Componente radice\n├── app.json        # Configurazione Expo\n├── package.json    # Dipendenze del progetto\n└── node_modules/   # Librerie installate\n```\nIl file `App.js` è il punto di ingresso della tua applicazione:\n\n```Js\nimport React from 'react';\nimport { StyleSheet, Text, View } from 'react-native';\n\nexport default function App() {\n  return (\n    <View style={styles.container}>\n      <Text style={styles.title}>Welcome to React Native + Expo!</Text>\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    backgroundColor: '#fff',\n    alignItems: 'center',\n    justifyContent: 'center',\n  },\n  title: {\n    fontSize: 20,\n    fontWeight: 'bold',\n  },\n});\n```\n## Esecuzione e Testing\n\n### Avviare l'app in sviluppo\n\n```Bash\nnpm start\n```\noppure:\n\n```Bash\nexpo start\n```\nQuesto avvia il Metro Bundler, il compilatore JavaScript di React Native.\n\n### Opzioni di testing\n\n| ==Opzione== | ==Comando== | ==Descrizione== |\n|---|---|---|\n| **Expo Go** | `w` o `i` o `a` | Scansiona il QR code dall'app Expo Go (device fisico) |\n| **Simulatore iOS** | `i` | Esegui sul simulatore Xcode (macOS) |\n| **Emulatore Android** | `a` | Esegui su Android Studio Emulator |\n| **Web** | `w` | Preview in browser (funzionalità limitate) |\n\n## Componenti Essenziali di React Native\n\nA differenza del web, React Native non usa HTML/CSS classici. Utilizza componenti nativi specifici:\n\n### Componenti fondamentali\n\n```Js\nimport {\n  View,           // equivalente a <div>\n  Text,           // equivalente a <p> o <span>\n  ScrollView,     // contenitore scrollabile\n  FlatList,       // lista ottimizzata\n  Image,          // immagini\n  TextInput,      // input di testo\n  TouchableOpacity, // bottone/elemento cliccabile\n  StyleSheet,     // sistema di styling\n} from 'react-native';\n```\n### Esempio pratico: Componente con Input\n\n```Js\nimport React, { useState } from 'react';\nimport { \n  View, \n  TextInput, \n  TouchableOpacity, \n  Text, \n  StyleSheet,\n  ScrollView \n} from 'react-native';\n\nexport default function TodoApp() {\n  const [todos, setTodos] = useState([]);\n  const [input, setInput] = useState('');\n\n  const addTodo = () => {\n    if (input.trim()) {\n      setTodos([...todos, { id: Date.now(), text: input }]);\n      setInput('');\n    }\n  };\n\n  return (\n    <ScrollView style={styles.container}>\n      <Text style={styles.header}>My Todo List</Text>\n      \n      <TextInput\n        style={styles.input}\n        placeholder="Add a new task..."\n        value={input}\n        onChangeText={setInput}\n      />\n      \n      <TouchableOpacity style={styles.button} onPress={addTodo}>\n        <Text style={styles.buttonText}>Add</Text>\n      </TouchableOpacity>\n\n      {todos.map(todo => (\n        <View key={todo.id} style={styles.todoItem}>\n          <Text>{todo.text}</Text>\n        </View>\n      ))}\n    </ScrollView>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: {\n    flex: 1,\n    padding: 20,\n    backgroundColor: '#f5f5f5',\n  },\n  header: {\n    fontSize: 24,\n    fontWeight: 'bold',\n    marginBottom: 15,\n  },\n  input: {\n    borderWidth: 1,\n    borderColor: '#ccc',\n    padding: 10,\n    marginBottom: 10,\n    borderRadius: 5,\n    backgroundColor: '#fff',\n  },\n  button: {\n    backgroundColor: '#007AFF',\n    padding: 12,\n    borderRadius: 5,\n    alignItems: 'center',\n    marginBottom: 15,\n  },\n  buttonText: {\n    color: '#fff',\n    fontWeight: 'bold',\n  },\n  todoItem: {\n    backgroundColor: '#fff',\n    padding: 12,\n    marginBottom: 8,\n    borderRadius: 5,\n  },\n});\n\n```\n## Gestione della Navigazione\n\nPer app con più schermate, installa React Navigation:\n\n```Bash\nnpm install @react-navigation/native @react-navigation/bottom-tabs\nnpm install react-native-screens react-native-safe-area-context\n```\n### Esempio: Navigazione a Tab\n\n```Javascript\nimport React from 'react';\nimport { NavigationContainer } from '@react-navigation/native';\nimport { createBottomTabNavigator } from '@react-navigation/bottom-tabs';\nimport { Text, View, StyleSheet } from 'react-native';\nimport { Ionicons } from '@expo/vector-icons';\n\nconst Tab = createBottomTabNavigator();\n\nfunction HomeScreen() {\n  return (\n    <View style={styles.screen}>\n      <Text>Home Screen</Text>\n    </View>\n  );\n}\n\nfunction SettingsScreen() {\n  return (\n    <View style={styles.screen}>\n      <Text>Settings Screen</Text>\n    </View>\n  );\n}\n\nexport default function App() {\n  return (\n    <NavigationContainer>\n      <Tab.Navigator\n        screenOptions={({ route }) => ({\n          tabBarIcon: ({ focused, color, size }) => {\n            const iconName = route.name === 'Home' ? 'home' : 'settings';\n            return <Ionicons name={iconName} size={size} color={color} />;\n          },\n        })}\n      >\n        <Tab.Screen name="Home" component={HomeScreen} />\n        <Tab.Screen name="Settings" component={SettingsScreen} />\n      </Tab.Navigator>\n    </NavigationContainer>\n  );\n}\n\nconst styles = StyleSheet.create({\n  screen: {\n    flex: 1,\n    justifyContent: 'center',\n    alignItems: 'center',\n  },\n});\n```\n## API Expo: Accesso alle Features Native\n\nExpo fornisce API pronte all'uso per accedere ai sensori e alle funzioni del device:\n\n### Accesso alla Fotocamera\n\n```Bash\nnpm install expo-camera\n```\n\n```Js\nimport { Camera } from 'expo-camera';\nimport { useState } from 'react';\n\nexport default function CameraApp() {\n  const [permission, requestPermission] = Camera.useCameraPermissions();\n\n  if (!permission) {\n    return <Text>Loading...</Text>;\n  }\n\n  if (!permission.granted) {\n    return (\n      <TouchableOpacity onPress={requestPermission}>\n        <Text>Grant camera access</Text>\n      </TouchableOpacity>\n    );\n  }\n\n  return <Camera style={{ flex: 1 }} />;\n}\n```\n### Geolocalizzazione\n\n```Js\nimport * as Location from 'expo-location';\n\nasync function getLocation() {\n  let { status } = await Location.requestForegroundPermissionsAsync();\n  if (status !== 'granted') {\n    alert('Permission denied');\n    return;\n  }\n\n  let location = await Location.getCurrentPositionAsync({});\n  console.log(location.coords);\n}\n```\n### Notifiche Push\n\n```Bash\nnpm install expo-notifications\n```\n\n```Js\nimport * as Notifications from 'expo-notifications';\n\nasync function sendNotification() {\n  await Notifications.scheduleNotificationAsync({\n    content: {\n      title: 'Test Notification',\n      body: 'This is a test push notification',\n    },\n    trigger: { seconds: 5 },\n  });\n}\n```\n## Best Practice di Sviluppo\n\n### 1. Organizzazione del codice\n\n```Schema\nsrc/\n├── screens/      # Schermate principali\n├── components/   # Componenti riutilizzabili\n├── services/     # Logica di business (API calls, auth)\n├── hooks/        # Custom hooks\n├── utils/        # Funzioni utility\n├── styles/       # Stili condivisi\n└── constants/    # Costanti e configurazioni\n```\n### 2. State Management\n\nPer app complesse, usa Redux o Zustand:\n\n```Bash\nnpm install zustand\n```\n\n```Js\nimport { create } from 'zustand';\n\nconst useStore = create((set) => ({\n  count: 0,\n  increment: () => set((state) => ({ count: state.count + 1 })),\n  decrement: () => set((state) => ({ count: state.count - 1 })),\n}));\n```\n### 3. Performance Optimization\n- Usa **FlatList** invece di **ScrollView** per liste lunghe\n- Memoizza componenti con `React.memo()`\n- Evita inline function definitions\n- Usa `useMemo()` e `useCallback()` per dati costosi\n\n\n```Js\nimport { FlatList } from 'react-native';\n\n<FlatList\n  data={items}\n  renderItem={({ item }) => <ItemComponent item={item} />}\n  keyExtractor={(item) => item.id.toString()}\n/>\n```\n### 4. Gestione Errori\n\n```Js\ntry {\n  const response = await fetch('https://api.example.com/data');\n  const data = await response.json();\n} catch (error) {\n  console.error('Fetch error:', error);\n  // Handle error UI\n}\n```\n\n## Build e Distribuzione\n\n### Configurare app.json\n\n```Json\n{\n  "expo": {\n    "name": "FirstApp",\n    "slug": "first-app",\n    "version": "1.0.0",\n    "assetBundlePatterns": ["**/*"],\n    "ios": {\n      "bundleIdentifier": "com.example.firstapp"\n    },\n    "android": {\n      "package": "com.example.firstapp"\n    }\n  }\n}\n```\n### Build per iOS\n\n```Bash\neas build --platform ios\n```\n### Build per Android\n\n```Bash\neas build --platform android\n```\n### Creare APK direttamente\n\n```Bash\neas build --platform android --local\n```\n\n## Troubleshooting Comune\n\n| ==Problema== | ==Soluzione== |\n|---|---|\n| **Metro Bundler non avvia** | `npm start --reset-cache` |\n| **Errore di permessi** | \tVerifica `app.json` e le configurazioni di permesso |\n| **App crasha su device reale** | \tControlla i log con `adb logcat` (Android) o Xcode Console (iOS) |\n| **Dipendenze non si installano** | `rm -rf node_modules && npm install` |\n| **Problema di versione Expo** | expo upgrade |\n\n---\n\n## Conclusione\n\n**React Native** con **Expo** elimina gran parte della complessità nello sviluppo mobile multipiattaforma, permettendo ai developer **JavaScript** di entrare nel mondo mobile con una curva di apprendimento ridotta. La possibilità di testare in tempo reale su device fisici tramite **Expo Go**, combinata con un ampio set di **API native pre-built** e un'ottima documentazione, rende questa stack ideale sia per prototipizzazione rapida che per applicazioni production.\n\nChe tu stia realizzando la tua prima app o ampliando il tuo stack di competenze come developer, React Native ed Expo offrono un percorso strutturato e community supportato per raggiungere il successo nel mobile development.\n\n**Prossimi step**: Esplora i moduli Expo disponibili, integra una piattaforma di stato management come Redux, e considera di pubblicare la tua app sugli app store ufficiali quando sarà pronta per il lancio.	Scopri come creare la tua prima applicazione mobile multipiattaforma usando React Native ed Expo. Una guida completa per principianti ed esperti, dalla configurazione iniziale alla pubblicazione sugli app store, con esempi pratici e best practice.	16	267	38	published	t	DKP-VAULT-CERT-ADMIN-1EIOKL	1c464b531ff6f5e5757e2c5ba85cafe3f5d8ca98bd2b9163cccd2e8eacce1706	4	2	2026-10-21 06:51:54.289051	2026-10-21 06:51:54.289051	["React Native", "Expo", "JavaScript/TypeScript", "Node.js", "Expo CLI", "Android Studio", "Xcode", "npm/yarn", "Mobile Development", "App Develpoment", "Multipiattaforma"]
53	Introduzione al Protocollo Pulse Nexus: La Nuova Era degli Agenti IA Context-Aware	introduzione-al-protocollo-pulse-nexus-la-nuova-era-degli-agenti-ia-context-aware	# Introduzione al Protocollo Pulse Nexus: La Nuova Era degli Agenti IA Context-Aware\n\nL'evoluzione dei sistemi basati su Large Language Models (LLM) ha superato da tempo la fase del semplice approccio "prompt-response". Oggigiorno, gli ingegneri del software e gli architetti di sistema si trovano ad affrontare una sfida ben più complessa: **l'orchestrazione di agenti autonomi in grado di operare con consapevolezza contestuale (Context-Awareness) persistente, bassa latenza e massima efficienza computazionale.**\n\nÈ con questo obiettivo che nasce il **Pulse Nexus Protocol**, il cuore pulsante dell'architettura di intelligenza artificiale integrata nell'ecosistema **DevKernelPulse (v2.5-GOLD)**.\n\nIn questo articolo analizzeremo la struttura fondamentale del protocollo, le scelte architetturali che ne garantiscono le prestazioni e come la gestione avanzata del contesto stia trasformando l'interazione tra sviluppatori e agenti IA.\n\n## Il Problema: La Deriva Contestuale negli Agenti Autonomi\n\nGli agenti IA tradizionali soffrono di due grandi limitazioni strutturali:\n-  **Context Window Drift (Degrado del Contesto):** All'aumentare della lunghezza della conversazione o della complessità del task, le informazioni rilevanti tendono a "diluirsi", portando a allucinazioni o alla perdita di direttiva.\n-  **Stateless Latency Overhead:** L'iniezione manuale e ridondante di tutto lo storico di esecuzione a ogni chiamata API genera costi computazionali elevati e latenze inaccettabili per ambienti di produzione.\n\nIl protocollo **Pulse Nexus** risolve queste criticità introducendo una pipeline di orchestrazione a tre livelli basata su memory-indexing dinamico e context-routing.\n\n## L'Architettura del Protocollo Pulse Nexus\n\nIl Pulse Nexus Protocol non si limita a passare testo a un modello generativo, ma agisce come un **middleware neurale deterministico**. L'architettura si articola su tre pilastri fondamentali:\n\n```Schema\n[ Developer / Client Request ]\n│\n▼\n┌──────────────────────────────┐\n│    Pulse Nexus Pipeline      │\n├──────────────────────────────┤\n│ 1. Context Stream Ingestion  │ ──► Dynamic Parsing & Token Pruning\n│ 2. Hybrid Memory Retrieval   │ ──► Vector Index (Pgvector) + KV State (Redis)\n│ 3. Semantic Task Routing     │ ──► Specialized Agent Dispatching\n└──────────────────────────────┘\n│\n▼\n[ Context-Aware Agent Execution ]\n```\n\n### 1. Dynamic Context Ingestion & Token Pruning\nA ogni interazione, il middleware di Nexus intercetta lo stream di input prima che raggiunga l'agente target. Tramite algoritmi di *token pruning* e *semantic compression*, il protocollo elimina il rumore sintattico mantenendo intatti gli identificatori critici (AST del codice, riferimenti a commit, ID di database o snippet di log).\n\n### 2. Architettura di Memoria Ibrida (Short-Term & Long-Term)\nNexus suddivide la memoria dell'agente in due livelli:\n* **Ephemeral Active State (TTL):** Gestito in-memory tramite Redis/Upstash a bassissima latenza per mantenere lo stato immediato del task in corso.\n* **Persistent Vector Vault:** Indicizzato in **Neon DB (Postgres)** sfruttando l'estensione `pgvector`. Questo permette all'agente di recuperare concetti, decisioni architetturali passate o regole del codebase attraverso ricerche di similarità coseno in tempo reale.\n\n### 3. gRPC & WebSocket Dual-Transport Layer\nPer garantire comunicazioni istantanee, Pulse Nexus utilizza un trasporto ibrido:\n* **WebSockets** per lo streaming bidirezionale di log, token di risposta e stato degli agenti direttamente sulla dashboard frontend.\n* **gRPC** per l'intercomunicazione micro-servizio a micro-servizio tra i nodi agentici distribuiti su GCP Cloud Run.\n\n## Integrazione nell'Ecosistema DKP (v2.5-GOLD)\n\nCon il rilascio della versione **v2.5-GOLD**, il Pulse Nexus Protocol è completamente integrato nei servizi chiave di DevKernelPulse:\n\n* **Nexus Assistant Chatbot:** L'assistente globale visibile in piattaforma non si limita a rispondere, ma "comprende" la pagina attiva dell'utente, i post consultati e il livello XP maturato, fornendo risposte calibrate sullo stato corrente della sessione.\n* **Automated Content Quality Assurance:** Gli agenti background utilizzano il protocollo per validare, categorizzare e verificare i link inviati dalla community nel *Tech News Feed*, garantendo uno standard qualitativo elevato prima dell'indicizzazione.\n* **Smart Ads Context Match:** Le campagne inserite nel DKP Ads Network vengono posizionate dinamicamente analizzando il contesto semantico degli articoli anziché affidarsi a meri tag statici.\n\n## Considerazioni Finali e Prospettive Future\n\nIl Protocollo Pulse Nexus rappresenta un passo fondamentale nella visione di **DevKernelPulse**: creare una piattaforma integrata dove sviluppatori, contenuti e agenti intelligenti collaborano all'interno dello stesso ecosistema in modo fluido e reattivo.\n\nNelle prossime release evolutive, il team si concentrerà sull'apertura di endpoint SDK dedicati alla community, permettendo agli sviluppatori di integrare i propri agenti custom direttamente nell'infrastruttura di Pulse Nexus.\n\n---\n\n*Sei pronto a sperimentare la potenza degli agenti Context-Aware? Esplora le discussioni sul feed o lancia il tuo primo post su DevKernelPulse!*\n\n\n\n\n	Un'analisi tecnica approfondita sull'architettura di Pulse Nexus Protocol (v2.5), il sistema che ridefinisce l'orchestrazione degli agenti IA tramite context-window dinamiche, memoria vettoriale distribuita e interoperabilità via gRPC/WebSocket.	7	23	46	published	t	DKP-VAULT-CERT-ADMIN-ZVGCZ6	86da5724142c90a85c2e7d1b197a6234799332be3fd0d9e6a801b036c6de0f62	2	1	2026-10-22 17:02:17.715063	2026-10-22 17:02:17.715063	["AI Agents", "Pulse Nexus", "Context Awareness", "Vector Search", "System Architecture", "LLM Orchestration", "DevKernelPulse", "Nuxt 4", "ypeScript", "Neon Postgres", "Postgres SQL", "Drizzle ORM", "Pgvector", "Redis/Upstash", "gRPC", "WebSockets", "GCP Cloud Run"]
55	Progettare uno schema SQL: tabelle, relazioni e vincoli essenziali	progettare-uno-schema-sql-tabelle-relazioni-e-vincoli-essenziali	# Introduzione: Perché il Design dello Schema Importa\n\nLa differenza tra un'applicazione che scala e una che crolla sotto carico non è spesso nel codice applicativo. È nello schema del database.\n\nUno schema ben progettato è invisibile—le query sono veloci, i dati sono consistenti, le migrazioni sono rare e indolore. Uno schema pessimo? È un incubo: refactoring continui, data migration disastrosi, performance issues che non si risolvono nemmeno con caching e query optimization.\n\nNel 2026, quando ogni applicazione gestisce terabyte di dati e milioni di utenti, il costo di una cattiva progettazione di schema non è più tollerabile. Non è solo un problema tecnico; è un problema aziendale.\n\nQuesto articolo ti insegna a **progettare schema SQL come un professionista**: dalla conceptualizzazione della struttura dati, attraverso la normalizzazione, fino ai vincoli di integrità e le strategie di performance. Useremo esempi concreti (e-commerce, social network, fintech) per rendere ogni concetto tangibile.\n\n## 1. Fondamenti: Tabelle, Righe e Colonne\n\n### Anatomia di una Tabella SQL\n\nUna tabella SQL è una collezione strutturata di dati organizzata in righe (record) e colonne (attributi).\n\n```SQL\nCREATE TABLE users (\n    user_id BIGINT PRIMARY KEY,\n    username VARCHAR(100) NOT NULL UNIQUE,\n    email VARCHAR(255) NOT NULL UNIQUE,\n    first_name VARCHAR(50),\n    last_name VARCHAR(50),\n    date_of_birth DATE,\n    is_active BOOLEAN DEFAULT TRUE,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n```\nIn questo esempio:\n- **Colonna**: ogni attributo (user_id, username, email, etc.)\n- **Riga**: un record che rappresenta un utente specifico\n- **Primary Key**: user_id identifica univocamente ogni riga\n- **Constraints**: vincoli che garantiscono l'integrità (NOT NULL, UNIQUE, DEFAULT)\n\n### Scegliere il Tipo di Dato Giusto\n\nLa scelta del tipo di dato ha implicazioni dirette su:\n- **Performance**: storage, velocità di query, indice efficiency\n- **Validazione**: vincoli logici incorporati nel database\n- **Compatibilità**: portabilità tra database engine\n\n### Tipi Numerici\n\n```SQL\n-- TINYINT: -128 a 127 (1 byte)\nCREATE TABLE quiz_scores (score TINYINT);\n\n-- SMALLINT: -32,768 a 32,767 (2 byte)\nCREATE TABLE room_capacity (capacity SMALLINT);\n\n-- INT: -2.1B a 2.1B (4 byte) - Uso comune\nCREATE TABLE product_count (count INT);\n\n-- BIGINT: -9.2 quintilioni a 9.2 quintilioni (8 byte) - Per ID ad alta scale\nCREATE TABLE transactions (transaction_id BIGINT);\n\n-- DECIMAL(p, s): Precisione fissa per valori monetari\nCREATE TABLE prices (price DECIMAL(10, 2));  -- 10 cifre totali, 2 dopo virgola\n\n-- FLOAT/DOUBLE: Numeri floating-point (approssimati)\nCREATE TABLE sensor_readings (temperature FLOAT);\n```\n**Regola d'oro**: Per soldi, usa `DECIMAL`, non `FLOAT`. I floating-point accumulano errori di arrotondamento.\n\n### Tipi Stringhe\n\n```SQL\n-- CHAR(n): Lunghezza fissa (padding se inferiore)\nCREATE TABLE country_codes (code CHAR(2));  -- 'US', 'IT', etc.\n\n-- VARCHAR(n): Lunghezza variabile (up to n)\nCREATE TABLE usernames (username VARCHAR(100));\n\n-- TEXT: Lunghezza illimitata (performance considerations)\nCREATE TABLE articles (content TEXT);\n\n-- ENUM: Valori predefiniti (database-specific, PostgreSQL)\nCREATE TABLE order_status_table (\n    status ENUM('pending', 'shipped', 'delivered', 'cancelled')\n);\n```\n\n### Tipi Data e Ora\n\n```SQL\n-- DATE: Solo la data\nCREATE TABLE birthdays (dob DATE);\n\n-- TIME: Solo l'ora\nCREATE TABLE business_hours (opens_at TIME);\n\n-- DATETIME/TIMESTAMP: Data + ora\nCREATE TABLE events (event_time TIMESTAMP);\n\n-- INTERVAL: Durata (PostgreSQL)\nCREATE TABLE task_durations (duration INTERVAL);\n```\n\n### Tipi Booleani\n\n```SQL\n-- BOOLEAN (o BOOL)\nCREATE TABLE features (is_enabled BOOLEAN);\n\n-- In MySQL, è spesso immagazzinato come TINYINT(1)\n-- 0 = FALSE, 1 = TRUE\n```\n\n### JSON (Semi-Structured Data)\n\n```SQL\n-- JSON o JSONB (PostgreSQL)\nCREATE TABLE user_preferences (\n    user_id BIGINT,\n    preferences JSONB  -- JSONB è più efficiente che JSON\n);\n\n-- Esempio di dato:\n-- {"theme": "dark", "notifications": {"email": true, "sms": false}}\n```\n\n### Naming Conventions: Coerenza e Chiarezza\n\nUna buona naming convention rende lo schema auto-documentante.\n\n```SQL\n-- ✅ BUONO: Nomi chiari, plurali per tabelle, singolari per colonne\nCREATE TABLE customers (\n    customer_id BIGINT PRIMARY KEY,\n    first_name VARCHAR(50),\n    last_name VARCHAR(50),\n    email_address VARCHAR(255),\n    phone_number VARCHAR(20),\n    created_at TIMESTAMP,\n    updated_at TIMESTAMP\n);\n\n-- ❌ CATTIVO: Nomi ambigui, abbreviazioni, inconsistenza\nCREATE TABLE cust (\n    cid INT PRIMARY KEY,\n    fn VARCHAR(50),\n    ln VARCHAR(50),\n    em VARCHAR(255),\n    ph VARCHAR(20),\n    cr TIMESTAMP,\n    upd TIMESTAMP\n);\n```\nConvenzioni consigliate:\n- **Tabelle**: plurale (users, products, orders)\n- **Colonne**: singolare, snake_case (user_id, product_name, order_date)\n- **Foreign keys**: `{tabella_singolare}_id` (user_id, product_id)\n- **Boolean columns**: prefisso `is_` o `has_` (is_active, has_premium)\n- **Timestamp columns**: `_at suffix` (created_at, updated_at, deleted_at)\n\n## 2. Chiavi e Identificatori: Il Cuore dello Schema\n\n### Primary Key (PK): L'Identificatore Unico\n\nUna primary key è un vincolo che identifica univocamente ogni riga nella tabella. Non possono esserci due righe con la stessa PK, e la PK non può essere NULL.\n\n```SQL\n-- ✅ Singola colonna come PK\nCREATE TABLE users (\n    user_id BIGINT PRIMARY KEY,\n    username VARCHAR(100)\n);\n\n-- ✅ Composite PK (più colonne)\nCREATE TABLE student_courses (\n    student_id INT,\n    course_id INT,\n    enrollment_date DATE,\n    PRIMARY KEY (student_id, course_id)\n);\n```\n### Natural vs. Surrogate Keys\n\n**Natural Key**: Un identificatore che ha significato nel dominio reale.\n\n```SQL\n-- Natural key: il codice ISBN è naturalmente unico per i libri\nCREATE TABLE books (\n    isbn VARCHAR(13) PRIMARY KEY,\n    title VARCHAR(255),\n    author_id INT\n);\n```\n**Surrogate Key**: Un identificatore artificiale (solitamente numerico o UUID).\n\n```SQL\n-- Surrogate key: book_id è artificiale, generato dal database\nCREATE TABLE books (\n    book_id BIGINT PRIMARY KEY,\n    isbn VARCHAR(13) UNIQUE,\n    title VARCHAR(255),\n    author_id INT\n);\n```\nQuando usare quale?\n\n| ==Aspetto== | ==Natural Key== | ==Surrogate Key== |\n|---|---|---|\n| **Leggibilità** | ✅ Significativo | \t❌ Arbitrario |\n| ****Stabilità** | ❌ Può cambiare | ✅ Mai |\n| Storage** | ❌ Potrebbe essere lungo | ✅ Compatto |\n| **Foreign Keys** | ❌ Relazioni lunghe | ✅ Relazioni piccole |\n| **Flessibilità** | ❌ Rigido | ✅ Flessibile |\n\n**Raccomandazione**: Usa surrogate key come PK (performance, flessibilità), ma mantieni un UNIQUE constraint sulla natural key se significativa.\n\n### BIGINT vs. UUID\n\n```SQL\n-- BIGINT (auto-increment)\nCREATE TABLE users (\n    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,\n    username VARCHAR(100)\n);\n\n-- UUID (Universally Unique Identifier)\nCREATE TABLE users (\n    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- PostgreSQL\n    username VARCHAR(100)\n);\n\n-- SQL Server\nCREATE TABLE users (\n    user_id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),\n    username VARCHAR(100)\n);\n```\nBIGINT vs. UUID:\n\n| ==Aspetto== | ==BIGINT== | ==UUID== |\n|---|---|---|\n| **Storage** | 8 byte | 16 byte |\n| **Leggibilità** | ✅ Facile | ❌ Lungo |\n| **Generazione** | ✅ Database auto | ❌ App-level/UUID function |\n| **Distribuito** | ❌ Difficile (coordination) | ✅ Facile (collision-free) |\n| **Sorting** | ✅ Naturale | ❌ Random |\n| **Scalabilità** | ⚠️ Bottleneck a scale | ✅ Senza limite |\nUsare **BIGINT** per applicazioni tradizionali. Usare **UUID** per sistemi distribuiti, microservizi, o quando non puoi garantire un'autorità centrale di assegnazione IDs.\n\n### Foreign Key (FK): Relazioni Integrità\n\nUna foreign key collega due tabelle, assicurando che il valore in una colonna corrisponda a una chiave primaria in un'altra tabella.\n\n```SQL\n-- Tabella genitore (parent)\nCREATE TABLE authors (\n    author_id BIGINT PRIMARY KEY,\n    name VARCHAR(100)\n);\n\n-- Tabella figlio (child)\nCREATE TABLE books (\n    book_id BIGINT PRIMARY KEY,\n    title VARCHAR(255),\n    author_id BIGINT NOT NULL,\n    FOREIGN KEY (author_id) REFERENCES authors(author_id)\n);\n```\n\n### ON DELETE / ON UPDATE Actions\n\nQuando elimini un record genitore, cosa succede ai figli?\n\n```SQL\n-- CASCADE: Elimina tutti i libri dell'autore\nCREATE TABLE books (\n    book_id BIGINT PRIMARY KEY,\n    title VARCHAR(255),\n    author_id BIGINT,\n    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE\n);\n\n-- SET NULL: Setta il valore a NULL (richiede che la colonna sia nullable)\nCREATE TABLE books (\n    book_id BIGINT PRIMARY KEY,\n    title VARCHAR(255),\n    author_id BIGINT,\n    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE SET NULL\n);\n\n-- RESTRICT: Blocca l'eliminazione se ci sono figli\nCREATE TABLE books (\n    book_id BIGINT PRIMARY KEY,\n    title VARCHAR(255),\n    author_id BIGINT,\n    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE RESTRICT\n);\n\n-- NO ACTION: Come RESTRICT (differente timing in transaction)\nCREATE TABLE books (\n    book_id BIGINT PRIMARY KEY,\n    title VARCHAR(255),\n    author_id BIGINT,\n    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE NO ACTION\n);\n```\nRegola empirica:\n- **CASCADE** per relazioni ownership (Author → Books: elimina l'autore, elimina i libri)\n- **SET NULL** per relazioni opzionali (Order → Salesperson: se elimini il venditore, l'ordine rimane orfano)\n- **RESTRICT** per relazioni critiche (Account → Transactions: non puoi eliminare un account con transazioni)\n\n### Unique Constraints: Garantire Unicità\n\n```SQL\nCREATE TABLE users (\n    user_id BIGINT PRIMARY KEY,\n    username VARCHAR(100) UNIQUE,  -- Singola colonna\n    email VARCHAR(255) UNIQUE\n);\n\n-- Composite unique (combinazione di colonne è unica)\nCREATE TABLE user_emails (\n    user_id BIGINT,\n    email_address VARCHAR(255),\n    is_primary BOOLEAN,\n    UNIQUE (user_id, email_address)\n);\n```\n**Attenzione ai NULL**: In standard SQL, NULL è considerato "sconosciuto". Due righe con NULL in una colonna UNIQUE sono permesse.\n\n```SQL\n-- ✅ Entrambi sono permessi perché NULL != NULL\nINSERT INTO users (user_id, username) VALUES (1, NULL);\nINSERT INTO users (user_id, username) VALUES (2, NULL);\n\n-- ❌ Questo fallisce\nINSERT INTO users (user_id, username) VALUES (3, 'john');\nINSERT INTO users (user_id, username) VALUES (4, 'john');  -- Duplicato\n```\n\n## 3. Relazioni tra Tabelle: I Tre Pattern Fondamentali\n\n### One-to-One (1:1)\n\nUna riga nella tabella A corrisponde a esattamente una riga nella tabella B, e viceversa.\n\n```SQL\n-- Shared Primary Key\nCREATE TABLE users (\n    user_id BIGINT PRIMARY KEY,\n    username VARCHAR(100)\n);\n\nCREATE TABLE user_profiles (\n    user_id BIGINT PRIMARY KEY,\n    bio TEXT,\n    profile_picture_url VARCHAR(255),\n    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE\n);\n\n-- Alternativa: Unique Foreign Key\nCREATE TABLE users (\n    user_id BIGINT PRIMARY KEY,\n    username VARCHAR(100)\n);\n\nCREATE TABLE user_profiles (\n    profile_id BIGINT PRIMARY KEY,\n    user_id BIGINT UNIQUE NOT NULL,\n    bio TEXT,\n    profile_picture_url VARCHAR(255),\n    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE\n);\n```\nQuando usare 1:1:\n- Separare dati "core" da dati "supplementari" per performance\n- Informazioni sensibili in una tabella separata (user → user_credentials)\n- Dati che non sempre sono presenti (user → user_premium_features)\n\n### One-to-Many (1:N)\n\nUna riga nella tabella genitore può avere molte righe nella tabella figlio, ma ogni riga figlio appartiene a una sola riga genitore.\n\n```SQL\n-- Tabella genitore\nCREATE TABLE authors (\n    author_id BIGINT PRIMARY KEY,\n    name VARCHAR(100)\n);\n\n-- Tabella figlio: molti libri per un autore\nCREATE TABLE books (\n    book_id BIGINT PRIMARY KEY,\n    title VARCHAR(255),\n    publication_year INT,\n    author_id BIGINT NOT NULL,\n    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE\n);\n\n-- Esempio di dato:\n-- authors: (1, 'J.K. Rowling')\n-- books: (1, 'Harry Potter and the Philosopher\\'s Stone', 1997, 1)\n-- books: (2, 'Harry Potter and the Chamber of Secrets', 1998, 1)\n-- books: (3, 'Harry Potter and the Prisoner of Azkaban', 1999, 1)\n```\nQuery per recuperare tutti i libri di un autore:\n\n```SQL\nSELECT b.title, b.publication_year\nFROM books b\nJOIN authors a ON b.author_id = a.author_id\nWHERE a.name = 'J.K. Rowling'\nORDER BY b.publication_year;\n```\nQuando usare 1:N:\n- **Parent → Children** (Author → Books, Customer → Orders, Company → Employees)\n- **Header → Detail** (Invoice → InvoiceItems, Order → OrderItems)\n- **Gestore → Gestione** (User → LoginAttempts, Product → PriceHistory)\n\nCascading Deletes: Attenzione ai CASCADE non intenzionali.\n\n```SQL\n-- ⚠️ PERICOLOSO: Eliminare un autore elimina TUTTI i suoi libri\nCREATE TABLE books (\n    book_id BIGINT PRIMARY KEY,\n    title VARCHAR(255),\n    author_id BIGINT,\n    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE\n);\n\n-- ✅ PIÙ SICURO: Blocca l'eliminazione se ci sono libri\nCREATE TABLE books (\n    book_id BIGINT PRIMARY KEY,\n    title VARCHAR(255),\n    author_id BIGINT,\n    FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE RESTRICT\n);\n```\n\n### Many-to-Many (M:N)\n\nUna riga nella tabella A può essere collegata a molte righe nella tabella B, e una riga nella tabella B può essere collegata a molte righe nella tabella A.\n\n```SQL\n-- Tabella studenti\nCREATE TABLE students (\n    student_id BIGINT PRIMARY KEY,\n    name VARCHAR(100)\n);\n\n-- Tabella corsi\nCREATE TABLE courses (\n    course_id BIGINT PRIMARY KEY,\n    course_name VARCHAR(100),\n    instructor VARCHAR(100)\n);\n\n-- Junction/Bridge table: collega studenti e corsi\nCREATE TABLE enrollments (\n    enrollment_id BIGINT PRIMARY KEY,\n    student_id BIGINT NOT NULL,\n    course_id BIGINT NOT NULL,\n    enrollment_date DATE,\n    grade CHAR(1),  -- 'A', 'B', 'C', etc.\n    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,\n    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,\n    UNIQUE (student_id, course_id)  -- Uno studente per corso\n);\n\n-- Esempio di dato:\n-- students: (1, 'Alice'), (2, 'Bob')\n-- courses: (1, 'Mathematics', 'Dr. Smith'), (2, 'Physics', 'Dr. Johnson')\n-- enrollments:\n--   (1, 1, 1, '2024-09-01', 'A')  -- Alice iscritta a Mathematics\n--   (2, 1, 2, '2024-09-01', 'B')  -- Alice iscritta a Physics\n--   (3, 2, 1, '2024-09-01', 'C')  -- Bob iscritto a Mathematics\n```\nQuery per trovare tutti i corsi di uno studente:\n\n```SQL\nSELECT c.course_name, c.instructor, e.grade\nFROM courses c\nJOIN enrollments e ON c.course_id = e.course_id\nWHERE e.student_id = 1;\n```\nQuery per trovare tutti gli studenti iscritti a un corso:\n\n```SQL\nSELECT s.name, e.grade\nFROM students s\nJOIN enrollments e ON s.student_id = e.student_id\nWHERE e.course_id = 1;\n```\n\n### Attributi sulla Junction Table\n\nLa junction table può contenere dati oltre alle sole foreign keys—questi sono "attributi della relazione".\n\n```SQL\n-- Senza attributi (semplice M:N)\nCREATE TABLE product_categories (\n    product_id BIGINT,\n    category_id BIGINT,\n    PRIMARY KEY (product_id, category_id),\n    FOREIGN KEY (product_id) REFERENCES products(id),\n    FOREIGN KEY (category_id) REFERENCES categories(id)\n);\n\n-- Con attributi (M:N ricca)\nCREATE TABLE product_categories (\n    product_id BIGINT,\n    category_id BIGINT,\n    is_primary BOOLEAN DEFAULT FALSE,  -- Categoria primaria del prodotto\n    featured_position INT,  -- Posizione nel display\n    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    PRIMARY KEY (product_id, category_id),\n    FOREIGN KEY (product_id) REFERENCES products(id),\n    FOREIGN KEY (category_id) REFERENCES categories(id)\n);\n```\n\n### Self-Referencing M:N (es. Social Network Followers)\n\nUna tabella può avere una relazione M:N con se stessa.\n\n```SQL\n-- Relazione di follow in un social network\nCREATE TABLE users (\n    user_id BIGINT PRIMARY KEY,\n    username VARCHAR(100)\n);\n\nCREATE TABLE follows (\n    follower_id BIGINT NOT NULL,\n    followee_id BIGINT NOT NULL,\n    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    PRIMARY KEY (follower_id, followee_id),\n    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,\n    FOREIGN KEY (followee_id) REFERENCES users(user_id) ON DELETE CASCADE,\n    CHECK (follower_id != followee_id)  -- Non puoi seguire te stesso\n);\n\n-- Esempio:\n-- users: (1, 'alice'), (2, 'bob'), (3, 'charlie')\n-- follows: (1, 2, ...), (1, 3, ...), (2, 3, ...)\n-- Significato: Alice segue Bob e Charlie, Bob segue Charlie\n```\nQuery per trovare i follower di un utente:\n\n```SQL\nSELECT u.username\nFROM users u\nJOIN follows f ON u.user_id = f.follower_id\nWHERE f.followee_id = 1;  -- Follower dell'utente 1\n```\nQuery per trovare chi sta seguendo:\n\n```SQL\nSELECT u.username\nFROM users u\nJOIN follows f ON u.user_id = f.followee_id\nWHERE f.follower_id = 1;  -- Chi sta seguendo l'utente 1\n```\n\n## 4. Vincoli di Integrità: Proteggere i Dati\n\n### NOT NULL: Campi Obbligatori\n\n```SQL\nCREATE TABLE users (\n    user_id BIGINT PRIMARY KEY,\n    username VARCHAR(100) NOT NULL,  -- Obbligatorio\n    email VARCHAR(255),  -- Opzionale\n    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Inserimento fallisce\nINSERT INTO users (user_id, email) VALUES (1, 'test@example.com');\n-- Error: Column 'username' cannot be null\n\n-- Inserimento riesce\nINSERT INTO users (user_id, username, email) VALUES (1, 'alice', 'alice@example.com');\n```\n**Regola**: Usa NOT NULL per campi logicamente obbligatori. NULL dovrebbe essere raro, non default.\n\n### CHECK Constraints: Validazione di Range e Valori\n\n```SQL\n-- Validare range numerico\nCREATE TABLE users (\n    user_id BIGINT PRIMARY KEY,\n    age INT CHECK (age >= 0 AND age <= 150),\n    username VARCHAR(100)\n);\n\n-- Validare set di valori permessi\nCREATE TABLE orders (\n    order_id BIGINT PRIMARY KEY,\n    status VARCHAR(20) CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),\n    total_amount DECIMAL(10, 2) CHECK (total_amount > 0)\n);\n\n-- Validazioni complesse\nCREATE TABLE products (\n    product_id BIGINT PRIMARY KEY,\n    name VARCHAR(100),\n    cost DECIMAL(10, 2),\n    price DECIMAL(10, 2),\n    CHECK (price > cost),  -- Prezzo deve essere maggiore del costo\n    CHECK (name != '')  -- Nome non può essere vuoto\n);\n\n-- Inserimento che violat il CHECK fallisce\nINSERT INTO orders (order_id, status, total_amount) \nVALUES (1, 'invalid_status', 100);\n-- Error: Check constraint violated\n```\n\n### DEFAULT Values: Valori Iniziali\n\n```SQL\n-- Valore statico\nCREATE TABLE products (\n    product_id BIGINT PRIMARY KEY,\n    name VARCHAR(100),\n    is_available BOOLEAN DEFAULT TRUE,\n    quantity_in_stock INT DEFAULT 0\n);\n\n-- Funzione/espressione\nCREATE TABLE events (\n    event_id BIGINT PRIMARY KEY,\n    name VARCHAR(100),\n    event_date DATE,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- PostgreSQL: UUID auto-generato\nCREATE TABLE accounts (\n    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    username VARCHAR(100)\n);\n\n-- MySQL: CURRENT_TIMESTAMP on update\nCREATE TABLE products (\n    product_id BIGINT PRIMARY KEY,\n    name VARCHAR(100),\n    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n);\n```\nQuando usare DEFAULT:\n- ✅ Timestamps (created_at, updated_at)\n- ✅ UUID/ID generation\n- ✅ Flag booleani (is_active = TRUE)\n- ❌ Valori di business logic (usa la app)\n\n### UNIQUE Constraints: Garantire Unicità\n\n```SQL\n-- Singola colonna\nCREATE TABLE users (\n    user_id BIGINT PRIMARY KEY,\n    username VARCHAR(100) UNIQUE NOT NULL,\n    email VARCHAR(255) UNIQUE NOT NULL\n);\n\n-- Multi-colonna (composite unique)\nCREATE TABLE user_phone_numbers (\n    user_id BIGINT,\n    phone_number VARCHAR(20),\n    country_code VARCHAR(2),\n    is_primary BOOLEAN,\n    UNIQUE (user_id, phone_number),  -- Stesso utente, numeri diversi\n    FOREIGN KEY (user_id) REFERENCES users(user_id)\n);\n\n-- Partial index (PostgreSQL) - Unique solo su righe attive\nCREATE UNIQUE INDEX idx_active_username \nON users (username) WHERE is_deleted = FALSE;\n```\n**Comportamento NULL**: In SQL standard, NULL è "unknown", quindi due NULL non sono considerati uguali. Questo significa due righe con NULL in una colonna UNIQUE sono permesse.\n\n```SQL\n-- Questo è permesso (due NULL)\nINSERT INTO users (user_id, username) VALUES (1, NULL);\nINSERT INTO users (user_id, username) VALUES (2, NULL);\n\n-- Questo non è permesso (duplicato)\nINSERT INTO users (user_id, username) VALUES (3, 'alice');\nINSERT INTO users (user_id, username) VALUES (4, 'alice');\n-- Error: Duplicate entry 'alice' for key 'username'\n```\n\n### FOREIGN KEY Actions: Cosa Succede ai Dati\n\n```SQL\n-- CASCADE: Operazione in cascata\nCREATE TABLE authors (\n    author_id BIGINT PRIMARY KEY,\n    name VARCHAR(100)\n);\n\nCREATE TABLE books (\n    book_id BIGINT PRIMARY KEY,\n    title VARCHAR(255),\n    author_id BIGINT,\n    FOREIGN KEY (author_id) REFERENCES authors(author_id) \n        ON DELETE CASCADE \n        ON UPDATE CASCADE\n);\n\n-- Se elimini un autore, tutti i suoi libri vengono eliminati\nDELETE FROM authors WHERE author_id = 1;\n-- → Tutti i libri con author_id = 1 vengono eliminati\n\n-- SET NULL: Setta a NULL i figli orfani\nCREATE TABLE orders (\n    order_id BIGINT PRIMARY KEY,\n    customer_id BIGINT,\n    salesman_id BIGINT,\n    FOREIGN KEY (salesman_id) REFERENCES salesmen(salesman_id) \n        ON DELETE SET NULL\n);\n\n-- Se elimini un venditore, gli ordini rimangono ma salesman_id = NULL\nDELETE FROM salesmen WHERE salesman_id = 5;\n-- → Orders con salesman_id = 5 ora hanno salesman_id = NULL\n\n-- RESTRICT: Blocca operazione se ci sono figli\nCREATE TABLE accounts (\n    account_id BIGINT PRIMARY KEY,\n    name VARCHAR(100)\n);\n\nCREATE TABLE transactions (\n    transaction_id BIGINT PRIMARY KEY,\n    account_id BIGINT,\n    amount DECIMAL(10, 2),\n    FOREIGN KEY (account_id) REFERENCES accounts(account_id) \n        ON DELETE RESTRICT\n);\n\n-- Non puoi eliminare un account con transazioni\nDELETE FROM accounts WHERE account_id = 1;\n-- Error: Cannot delete account with existing transactions\n\n-- NO ACTION: Simile a RESTRICT (timing differente in transazioni)\nCREATE TABLE orders (\n    order_id BIGINT PRIMARY KEY,\n    customer_id BIGINT,\n    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) \n        ON DELETE NO ACTION\n);\n```\n\n## 5. Normalizzazione: Dalla 1NF a BCNF\n\nLa normalizzazione è il processo di organizzare i dati per ridurre ridondanza e anomalie.\n\n### Anomalie: Il Problema\n\nPrima di normalizzare, comprendiamo i problemi che la normalizzazione risolve.\n\n```SQL\n-- ❌ Schema NON NORMALIZZATO (male!)\nCREATE TABLE student_courses_denormalized (\n    student_id INT,\n    student_name VARCHAR(100),\n    course_1 VARCHAR(100),\n    course_2 VARCHAR(100),\n    course_3 VARCHAR(100),\n    course_4 VARCHAR(100),\n    instructor_1 VARCHAR(100),\n    instructor_2 VARCHAR(100),\n    instructor_3 VARCHAR(100),\n    instructor_4 VARCHAR(100)\n);\n\n-- Problemi:\n-- 1. Repeating groups (course_1, course_2, etc.)\n-- 2. Se uno studente ha 5 corsi, non puoi memorizzarli\n-- 3. Aggiungere un corso significa modificare la struttura della tabella\n-- 4. Inconsistenza dati (istructor_1 sbagliato per course_1)\n```\n\n### Prima Forma Normale (1NF): Atomic Values\n\n**Definizione**: Ogni colonna contiene valori atomici (indivisibili). No repeating groups.\n\n```SQL\n-- ❌ NON È 1NF: colonna repeating\nCREATE TABLE students_courses (\n    student_id INT PRIMARY KEY,\n    student_name VARCHAR(100),\n    courses VARCHAR(500)  -- 'Math, Physics, Chemistry' - non atomico\n);\n\n-- ✅ È 1NF: valori atomici\nCREATE TABLE students (\n    student_id INT PRIMARY KEY,\n    student_name VARCHAR(100)\n);\n\nCREATE TABLE enrollments (\n    enrollment_id INT PRIMARY KEY,\n    student_id INT,\n    course_name VARCHAR(100),\n    FOREIGN KEY (student_id) REFERENCES students(student_id)\n);\n```\n\n### Seconda Forma Normale (2NF): Dipendenze Funzionali Complete\n\n**Definizione**: Deve essere in 1NF. Ogni colonna non-chiave deve dipendere completamente dalla INTERA chiave primaria, non da parte di essa.\n\n```SQL\n-- ❌ NON È 2NF\nCREATE TABLE student_courses (\n    student_id INT,\n    course_id INT,\n    student_name VARCHAR(100),  -- Dipende solo da student_id, non da (student_id, course_id)\n    instructor VARCHAR(100),     -- Dipende solo da course_id\n    PRIMARY KEY (student_id, course_id)\n);\n\n-- ✅ È 2NF: dipendenze complete\nCREATE TABLE students (\n    student_id INT PRIMARY KEY,\n    student_name VARCHAR(100)\n);\n\nCREATE TABLE courses (\n    course_id INT PRIMARY KEY,\n    instructor VARCHAR(100)\n);\n\nCREATE TABLE enrollments (\n    student_id INT,\n    course_id INT,\n    enrollment_date DATE,\n    PRIMARY KEY (student_\n```\n\n## 6. Normalizzazione e Integrità dei Dati\n\n### Seconda Forma Normale (2NF)\n\nLa Seconda Forma Normale si costruisce sulla 1NF eliminando le dipendenze parziali. Una dipendenza parziale si verifica quando un attributo non-chiave dipende solo da una parte di una chiave primaria composita, anziché dall'intera chiave.\n\n**Definizione**\nUna tabella è in **2NF** se è già in **1NF**, e ogni attributo non-chiave dipende completamente dalla chiave primaria intera (non solo da una porzione di essa).\n\n**Esempio di Violazione**\nConsideriamo una tabella `Iscrizione` con una chiave primaria composita (`StudenteID`, `CorsoID`):\n\n```SQL\nCREATE TABLE Iscrizione (\n    StudenteID INT,\n    CorsoID INT,\n    NomeCorso VARCHAR(100),  -- Dipende solo da CorsoID, non da StudenteID\n    DataIscrizione DATE,      -- Dipende da StudenteID e CorsoID ✓\n    Voto CHAR(1),             -- Dipende da StudenteID e CorsoID ✓\n    PRIMARY KEY (StudenteID, CorsoID)\n);\n```\n**Il problema**: NomeCorso dipende solo da CorsoID, creando una dipendenza parziale. Se aggiorniamo il nome di un corso, dobbiamo farlo in tutte le iscrizioni per quel corso.\n\n**Risoluzione**: Decomposizione in Tabelle Separate\n\n```SQL\nCREATE TABLE Corso (\n    CorsoID INT PRIMARY KEY,\n    NomeCorso VARCHAR(100)\n);\n\nCREATE TABLE Iscrizione (\n    StudenteID INT,\n    CorsoID INT,\n    DataIscrizione DATE,\n    Voto CHAR(1),\n    PRIMARY KEY (StudenteID, CorsoID),\n    FOREIGN KEY (CorsoID) REFERENCES Corso(CorsoID)\n);\n```\nOra `NomeCorso` è memorizzato una sola volta nella tabella `Corso`, eliminando ridondanza e anomalie.\n\n### Terza Forma Normale (3NF)\n\nLa Terza Forma Normale elimina le dipendenze transitive, dove attributi non-chiave dipendono da altri attributi non-chiave piuttosto che direttamente dalla chiave primaria.\n\n**Definizione**\nUna tabella è in 3NF se è già in 2NF E nessun attributo non-chiave è transitivamente dipendente dalla chiave primaria attraverso un altro attributo non-chiave.\n\n**Esempio di Violazione**\nConsideriamo una tabella Dipendente:\n\n```SQL\nCREATE TABLE Dipendente (\n    DipendeteID INT PRIMARY KEY,\n    NomeDipendente VARCHAR(100),\n    DipartimentoID INT,\n    NomeDipartimento VARCHAR(100),  -- Dipende da DipartimentoID, non da DipendeteID ✗\n    BudgetDipartimento DECIMAL(12, 2)  -- Dipende da DipartimentoID, non da DipendeteID ✗\n);\n```\n**Il problema**: `NomeDipartimento` e `BudgetDipartimento` sono transitivamente dipendenti da `DipendeteID` attraverso `DipartimentoID`. Se aggiorniamo il budget di un dipartimento, dobbiamo aggiornarlo in ogni record dei dipendenti.\n\n**Risoluzione**: Estrazione di Attributi Dipendenti in Tabelle Separate\n\n```SQL\nCREATE TABLE Dipartimento (\n    DipartimentoID INT PRIMARY KEY,\n    NomeDipartimento VARCHAR(100),\n    BudgetDipartimento DECIMAL(12, 2)\n);\n\nCREATE TABLE Dipendente (\n    DipendeteID INT PRIMARY KEY,\n    NomeDipendente VARCHAR(100),\n    DipartimentoID INT,\n    FOREIGN KEY (DipartimentoID) REFERENCES Dipartimento(DipartimentoID)\n);\n```\nOra ogni attributo dipende direttamente dalla chiave primaria della sua tabella.\n\n### Forma Normale di Boyce-Codd (BCNF)\n\n**La Forma Normale di Boyce-Codd (BCNF) è una versione più ristretta della 3NF** che richiede che ogni determinante (un attributo che determina un altro attributo) sia una chiave candidata.\n\n**Definizione**\nUna tabella è in **BCNF** se, per ogni dipendenza funzionale `X → Y`, `X` è una chiave candidata della tabella.\n\n**Quando 3NF È Insufficiente**\nConsideriamo una tabella `ProfessoreCorso` dove i professori possono insegnare più corsi e ogni corso ha un professore:\n\n```SQL\nCREATE TABLE ProfessoreCorso (\n    ProfessoreID INT,\n    CorsoID INT,\n    FasciaOraria VARCHAR(50),\n    PRIMARY KEY (ProfessoreID, CorsoID)\n);\n```\nSupponiamo di aggiungere il vincolo: "Ogni professore insegna solo un corso in una determinata fascia oraria."\n\nQuesto crea una dipendenza funzionale: (`ProfessoreID`,` FasciaOraria`) → `CorsoID`\n\nTuttavia, (`ProfessoreID`, `FasciaOraria`) non è una chiave candidata per la chiave primaria (`ProfessoreID`, `CorsoID`). Questo viola **BCNF**.\n\n**Risoluzione**: Decomposizione Ulteriore\n\n```SQL\nCREATE TABLE OrarioProfessore (\n    ProfessoreID INT,\n    FasciaOraria VARCHAR(50),\n    CorsoID INT,\n    PRIMARY KEY (ProfessoreID, FasciaOraria),\n    FOREIGN KEY (CorsoID) REFERENCES Corso(CorsoID)\n```\nOra (`ProfessoreID`, `FasciaOraria`) è la chiave primaria, soddisfacendo BCNF.\n\n## Modelli di Progettazione di Schema Pratica\n\n### Relazioni Uno-a-Uno\n\n**Modello**: Ogni record nella Tabella A corrisponde esattamente a un record nella Tabella B.\n\n```SQL\nCREATE TABLE Utente (\n    UtenteID INT PRIMARY KEY,\n    NomeUtente VARCHAR(100) UNIQUE NOT NULL\n);\n\nCREATE TABLE ProfiloUtente (\n    ProfiloID INT PRIMARY KEY,\n    UtenteID INT UNIQUE NOT NULL,\n    Bio TEXT,\n    Avatar VARCHAR(255),\n    FOREIGN KEY (UtenteID) REFERENCES Utente(UtenteID) ON DELETE CASCADE\n);\n```\n**Punto Chiave**: Il vincolo `UNIQUE` su `UtenteID` in `ProfiloUtente` garantisce la cardinalità ==uno-a-uno==. La combinazione `UNIQUE NOT NULL` previene profili multipli per utente.\n\n### Relazioni Uno-a-Molti\n\n**Modello**: Un record nella Tabella A può avere più record nella Tabella B, ma ogni record in Tabella B appartiene a un solo record nella Tabella A.\n\n```SQL\nCREATE TABLE Autore (\n    AutoreID INT PRIMARY KEY,\n    NomeAutore VARCHAR(100)\n);\n\nCREATE TABLE Libro (\n    LibroID INT PRIMARY KEY,\n    TitoloLibro VARCHAR(255),\n    AutoreID INT NOT NULL,\n    AnnoPubblicazione INT,\n    FOREIGN KEY (AutoreID) REFERENCES Autore(AutoreID) ON DELETE CASCADE\n);\n```\n**Punto Chiave**: `AutoreID` in `Libro` è una chiave esterna regolare (non unica), permettendo più libri per autore.\n\n### Relazioni Molti-a-Molti\n\n**Modello**: I record nella Tabella A possono avere più record nella Tabella B, e viceversa. Utilizzare una tabella di giunzione (o tabella di join).\n\n```SQL\nCREATE TABLE Studente (\n    StudenteID INT PRIMARY KEY,\n    NomeStudente VARCHAR(100)\n);\n\nCREATE TABLE Corso (\n    CorsoID INT PRIMARY KEY,\n    NomeCorso VARCHAR(100)\n);\n\nCREATE TABLE Iscrizione (\n    IscrizioneID INT PRIMARY KEY,\n    StudenteID INT NOT NULL,\n    CorsoID INT NOT NULL,\n    DataIscrizione DATE,\n    Voto CHAR(1),\n    UNIQUE(StudenteID, CorsoID),\n    FOREIGN KEY (StudenteID) REFERENCES Studente(StudenteID) ON DELETE CASCADE,\n    FOREIGN KEY (CorsoID) REFERENCES Corso(CorsoID) ON DELETE CASCADE\n);\n```\n**Punti Chiave**:\n- La tabella di giunzione `Iscrizione` contiene chiavi esterne sia a `Studente` che a `Corso`.\n- `UNIQUE``(StudenteID`, `CorsoID`) previene iscrizioni duplicate.\n- Le eliminazioni a cascata garantiscono l'integrità referenziale.\n\n### Relazioni Auto-Referenziali (Gerarchie)\n\n**Modello**: Una tabella fa riferimento a se stessa per rappresentare strutture gerarchiche come organigrammi o alberi di categorie.\n\n```SQL\nCREATE TABLE Categoria (\n    CategoriaID INT PRIMARY KEY,\n    NomeCategoria VARCHAR(100),\n    CategoriaPadreID INT,\n    FOREIGN KEY (CategoriaPadreID) REFERENCES Categoria(CategoriaID) ON DELETE SET NULL\n);\n\n-- Dati di Esempio\nINSERT INTO Categoria (CategoriaID, NomeCategoria, CategoriaPadreID) VALUES\n(1, 'Elettronica', NULL),\n(2, 'Computer', 1),\n(3, 'Laptop', 2),\n(4, 'Desktop', 2);\n```\n**Punti Chiave**:\n- `CategoriaPadreID` consente l'auto-riferimento per strutture gerarchiche.\n- `ON DELETE SET NULL` previene record orfani.\n- Le query richiedono **CTE** ricorsive (Common Table Expressions) o logica a livello di applicazione per attraversare le gerarchie.\n\n## Anti-Pattern e Errori Comuni\n\n### Anti-Pattern 1: Denormalizzazione Senza Giustificazione\n\n**Problema**: Memorizzare dati ridondanti per evitare join, degradando la qualità dei dati.\n\n```SQL\n-- ✗ SBAGLIATO: Memorizzare il nome dello studente in ogni iscrizione\nCREATE TABLE Iscrizione (\n    IscrizioneID INT PRIMARY KEY,\n    StudenteID INT,\n    NomeStudente VARCHAR(100),  -- Ridondante!\n    CorsoID INT\n);\n```\n**Soluzione**: Mantenere la struttura normalizzata; utilizzare join quando necessario.\n\n```SQL\n-- ✓ CORRETTO\nCREATE TABLE Iscrizione (\n    IscrizioneID INT PRIMARY KEY,\n    StudenteID INT NOT NULL,\n    CorsoID INT NOT NULL,\n    FOREIGN KEY (StudenteID) REFERENCES Studente(StudenteID)\n);\n```\n\n### Anti-Pattern 2: Utilizzare VARCHAR(MAX) o TEXT per Tutto\n\n**Problema**: Nessuna validazione dei dati; archiviazione e indicizzazione inefficienti.\n\n```SQL\n-- ✗ SBAGLIATO\nCREATE TABLE Prodotto (\n    ProdottoID INT PRIMARY KEY,\n    Prezzo VARCHAR(MAX)  -- Dovrebbe essere DECIMAL!\n);\n```\n**Soluzione**: Scegliere tipi di dati appropriati.\n\n```SQL\n-- ✓ CORRETTO\nCREATE TABLE Prodotto (\n    ProdottoID INT PRIMARY KEY,\n    Prezzo DECIMAL(10, 2) NOT NULL\n);\n```\n\n### Anti-Pattern 3: Vincoli Mancanti\n\n**Problema**: Consentire dati non validi nel database.\n\n```SQL\n-- ✗ SBAGLIATO\nCREATE TABLE Ordine (\n    OrdineID INT PRIMARY KEY,\n    Quantita INT,  -- Può essere negativa!\n    DataOrdine DATE  -- Può essere nel futuro!\n);\n```\n**Soluzione**: Aggiungere vincoli espliciti.\n\n```SQL\n-- ✓ CORRETTO\nCREATE TABLE Ordine (\n    OrdineID INT PRIMARY KEY,\n    Quantita INT NOT NULL CHECK (Quantita > 0),\n    DataOrdine DATE NOT NULL CHECK (DataOrdine <= CURRENT_DATE)\n);\n```\n\n### Anti-Pattern 4: Convenzioni di Denominazione Scarsissime\n\n**Problema**: Nomi di colonne cryptici rendono difficile la comprensione delle query.\n\n```SQL\n-- ✗ SBAGLIATO\nCREATE TABLE tbl_usr (\n    usr_id INT,\n    n VARCHAR(100),\n    c VARCHAR(100)\n);\n```\n**Soluzione**: Utilizzare nomi chiari e descrittivi.\n\n```SQL\n-- ✓ CORRETTO\nCREATE TABLE Utente (\n    UtenteID INT PRIMARY KEY,\n    Nome VARCHAR(100),\n    Email VARCHAR(255)\n);\n```\n\n### Anti-Pattern 5: Nessuna Strategia di Indicizzazione\n\n**Problema**: Le query vengono eseguite lentamente man mano che i dati crescono.\n\n```SQL\n-- ✗ SBAGLIATO: Nessun indice su colonne frequentemente cercate\nCREATE TABLE Cliente (\n    ClienteID INT PRIMARY KEY,\n    Email VARCHAR(255)  -- Spesso cercato ma non indicizzato\n);\n```\n**Soluzione**: Creare indici strategicamente.\n\n```SQL\n-- ✓ CORRETTO\nCREATE TABLE Cliente (\n    ClienteID INT PRIMARY KEY,\n    Email VARCHAR(255) UNIQUE NOT NULL\n);\n\nCREATE INDEX idx_cliente_email ON Cliente(Email);\n```\n\n## Considerazioni Avanzate\n\n### Scelta tra Chiavi Naturali e Surrogate\n\n**Chiave Naturale**: Utilizza attributi di dominio esistenti (ad es. email, codice fiscale).\n\n```SQL\nCREATE TABLE Utente (\n    Email VARCHAR(255) PRIMARY KEY,\n    NomeCompleto VARCHAR(100)\n);\n```\n**Vantaggi**: Significativa, senza dati artificiali.\n**Svantaggi**: Potrebbe cambiare nel tempo; le chiavi composite possono essere ingombranti.\n\n**Chiave Surrogate**: Identificatore artificiale (ad es. auto-increment, UUID).\n\n```SQL\nCREATE TABLE Utente (\n    UtenteID INT PRIMARY KEY AUTO_INCREMENT,\n    Email VARCHAR(255) UNIQUE NOT NULL,\n    NomeCompleto VARCHAR(100)\n);\n```\n**Vantaggi**: Stabile, semplice, efficiente per join.\n**Svantaggi**: Aggiunge un livello di indirezione.\n\n**Raccomandazione**: Utilizzare chiavi surrogate per chiavi primarie; aggiungere vincoli univoci su chiavi naturali per la logica di business.\n\n### UUID vs. BIGINT per Sistemi Distribuiti\n\n**BIGINT** (Auto-Increment):\n\n```SQL\nCREATE TABLE Evento (\n    EventoID BIGINT PRIMARY KEY AUTO_INCREMENT,\n    NomeEvento VARCHAR(100)\n);\n```\n**Vantaggi**: Compatto (8 byte), semplice, supporto auto-increment.\n**Svantaggi**: Non globalmente univoco tra sistemi distribuiti; sequenziale (potenziali hotspot).\n\n**UUID**:\n\n```SQL\nCREATE TABLE Evento (\n    EventoID UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    NomeEvento VARCHAR(100)\n);\n```\n**Vantaggi**: Globalmente univoco, nessun coordinamento necessario, non sequenziale.\n**Svantaggi**: Più grande (16 byte), meno efficiente per indice, difficile da leggere.\n\n**Raccomandazione**: Utilizzare BIGINT per sistemi monolitici; UUID per architetture distribuite o microservizi.\n\n### Azioni di Chiave Esterna\n\n**ON DELETE** e **ON UPDATE** definiscono il comportamento di cascata:\n\n```SQL\nCREATE TABLE Autore (\n    AutoreID INT PRIMARY KEY\n);\n\nCREATE TABLE Libro (\n    LibroID INT PRIMARY KEY,\n    AutoreID INT,\n    FOREIGN KEY (AutoreID) REFERENCES Autore(AutoreID)\n        ON DELETE CASCADE      -- Elimina libri quando l'autore è eliminato\n        ON UPDATE CASCADE      -- Aggiorna chiave esterna se la chiave primaria cambia\n);\n```\nOpzioni:\n- **CASCADE**: Propaga il cambiamento.\n- **SET NULL**: Imposta a NULL se il record referenziato è eliminato.\n- **RESTRICT**: Previene eliminazione/aggiornamento se referenziato.\n- **NO ACTION**: Come RESTRICT; controllato alla fine della transazione.\n- **SET DEFAULT**: Imposta al valore predefinito.\n\n## Prestazioni e Ottimizzazione delle Query\n\n### Progettazione degli Indici\n\n**Gli indici compositi** ottimizzano le ricerche multi-colonna:\n\n```SQL\nCREATE INDEX idx_ordine_cliente_data \nON Ordine(ClienteID, DataOrdine DESC);\n```\n**Regola ESR**: Uguaglianza → Sort → Range\n- **E (Equality)**: Colonne con condizioni di uguaglianza (`=`).\n- **S (Sort)**: Colonne utilizzate in `ORDER BY`.\n- **R (Range)**: Colonne con condizioni di intervallo (`>`, `<`, `BETWEEN`).\n\n```SQL\n-- ✓ CORRETTO: Segue la regola ESR\nCREATE INDEX idx_ordine_ottimale \nON Ordine(ClienteID, DataOrdine DESC, Importo);\n\n-- Query che sfrutta questo indice:\nSELECT * FROM Ordine\nWHERE ClienteID = 5 AND Importo > 100\nORDER BY DataOrdine DESC;\n```\n\n### Benefici dello Schema Normalizzato\n\nUna schema normalizzato migliora le prestazioni:\n1. **Riduce il Volume di Dati**: Meno ridondanza significa meno I/O su disco.\n2. **Migliora la Compressione**: Motori come PostgreSQL comprimono meglio i dati omogenei.\n3. **Accelera gli Aggiornamenti**: Modifiche in un'unica posizione.\n\n```SQL\n-- Query normalizzata con join:\nSELECT d.NomeDipendente, dip.NomeDipartimento\nFROM Dipendente d\nJOIN Dipartimento dip ON d.DipartimentoID = dip.DipartimentoID\nWHERE d.DipendeteID = 10;\n```\nPostgreSQL e MySQL possono unire efficacemente su chiavi esterne ben indicizzate.\n\n### Denormalizzazione Selettiva per i Report\n\nTalvolta, per i carichi di lavoro di sola lettura intensivi (BI, report), è utile denormalizzare:\n\n```SQL\n-- Tabella materializzata per report\nCREATE TABLE VenditePerDipartimento AS\nSELECT \n    dip.NomeDipartimento,\n    COUNT(v.VenditaID) AS NumeroVendite,\n    SUM(v.Importo) AS TotaleVendite\nFROM Dipartimento dip\nJOIN Dipendente d ON dip.DipartimentoID = d.DipartimentoID\nJOIN Vendita v ON d.DipendeteID = v.DipendeteID\nGROUP BY dip.DipartimentoID, dip.NomeDipartimento;\n\n-- Aggiorna periodicamente (ad es. di notte)\nREFRESH MATERIALIZED VIEW VenditePerDipartimento;\n```\n**Punto Chiave**: La denormalizzazione è accettabile per viste materializzate e tabelle di report, non per il sistema transazionale principale.\n\n## Integrità Referenziale Avanzata\n\n### Vincoli CHECK per Validazione Logica\n\nI vincoli `CHECK` applicano regole di business a livello di database:\n\n```SQL\nCREATE TABLE Prodotto (\n    ProdottoID INT PRIMARY KEY,\n    NomeProdotto VARCHAR(100),\n    PrezzoAcquisto DECIMAL(10, 2),\n    PrezzoVendita DECIMAL(10, 2),\n    QuantitaMagazzino INT,\n    CHECK (PrezzoVendita > PrezzoAcquisto),\n    CHECK (QuantitaMagazzino >= 0)\n);\n```\n**Vantaggi**: Previene dati non validi a livello di database, indipendentemente da quale applicazione scrive.\n\n```SQL\nCREATE TABLE Audit (\n    AuditID INT PRIMARY KEY AUTO_INCREMENT,\n    Tabella VARCHAR(100),\n    Azione VARCHAR(50),\n    DataModifica TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    UtenteMod VARCHAR(100) DEFAULT USER()\n);\n```\nI valori predefiniti garantiscono coerenza e riducono la logica dell'applicazione.\n\n### Colonne Calcolate (Generato)\n\nIn database moderni come **PostgreSQL** e **MySQL 5.7+**:\n\n```SQL\nCREATE TABLE Ordine (\n    OrdineID INT PRIMARY KEY,\n    SubTotale DECIMAL(10, 2),\n    TassaAliquota DECIMAL(5, 4),\n    Tassa DECIMAL(10, 2) GENERATED ALWAYS AS (SubTotale * TassaAliquota) STORED,\n    Totale DECIMAL(10, 2) GENERATED ALWAYS AS (SubTotale + Tassa) STORED\n);\n```\n**Vantaggi**: Nessuna ridondanza; il valore è sempre coerente.\n\n## Checklist di Progettazione dello Schema\n\nApplica questa checklist quando progetti uno schema:\n\n| ==Aspetto== | ==Controllo== |\n|---|---|\n| **Normalizzazione**  | Lo schema è almeno in 3NF? Sono stati evitati attributi ridondanti? |\n| **Chiavi Primarie** | Ogni tabella ha una chiave primaria? È appropriata (naturale vs. surrogate)? |\n| **Chiavi Esterne** | Tutte le relazioni sono rappresentate da chiavi esterne? |\n| **Vincoli** | Sono definiti NOT NULL, UNIQUE, CHECK, DEFAULT dove opportuno? |\n| **Tipi di Dati** | Sono stati scelti tipi appropriati (INT vs. VARCHAR, DECIMAL vs. FLOAT)? |\n| **Denominazione** | \tI nomi sono chiari, coerenti e seguono le convenzioni aziendali? |\n| **Indici** | \tSono indicizzate le colonne FK, le colonne cercate e le colonne in WHERE/ORDER BY? |\n| **Scalabilità** | Lo schema supporta la crescita (BIGINT per ID, partitioning se necessario)? |\n| **Integrità Referenziale** | Le azioni ON DELETE/UPDATE sono appropriate? |\n| **Documantazione** | \tSono documentati lo scopo della tabella, le colonne e le relazioni? |\n\n## Esempio Completo: Sistema di Gestione Biblioteca\n\n```SQL\n-- Tabelle normalizzate in 3NF\n\nCREATE TABLE Autore (\n    AutoreID INT PRIMARY KEY AUTO_INCREMENT,\n    NomeAutore VARCHAR(100) NOT NULL,\n    DataNascita DATE,\n    UNIQUE(NomeAutore)\n);\n\nCREATE TABLE Editore (\n    EditoreID INT PRIMARY KEY AUTO_INCREMENT,\n    NomeEditore VARCHAR(100) NOT NULL UNIQUE,\n    Paese VARCHAR(50)\n);\n\nCREATE TABLE Genere (\n    GenereID INT PRIMARY KEY AUTO_INCREMENT,\n    NomeGenere VARCHAR(50) NOT NULL UNIQUE\n);\n\nCREATE TABLE Libro (\n    LibroID INT PRIMARY KEY AUTO_INCREMENT,\n    TitoloLibro VARCHAR(255) NOT NULL,\n    AutoreID INT NOT NULL,\n    EditoreID INT NOT NULL,\n    GenereID INT NOT NULL,\n    AnnoPubblicazione INT CHECK (AnnoPubblicazione > 0),\n    ISBN VARCHAR(13) UNIQUE,\n    Pagine INT CHECK (Pagine > 0),\n    FOREIGN KEY (AutoreID) REFERENCES Autore(AutoreID) ON DELETE RESTRICT,\n    FOREIGN KEY (EditoreID) REFERENCES Editore(EditoreID) ON DELETE RESTRICT,\n    FOREIGN KEY (GenereID) REFERENCES Genere(GenereID) ON DELETE RESTRICT\n);\n\nCREATE TABLE Copia (\n    CopiaID INT PRIMARY KEY AUTO_INCREMENT,\n    LibroID INT NOT NULL,\n    NumeroSeriale VARCHAR(50) UNIQUE NOT NULL,\n    DataAcquisizione DATE DEFAULT CURRENT_DATE,\n    Condizione ENUM('Eccellente', 'Buono', 'Accettabile', 'Usurato'),\n    FOREIGN KEY (LibroID) REFERENCES Libro(LibroID) ON DELETE CASCADE\n);\n\nCREATE TABLE Utente (\n    UtenteID INT PRIMARY KEY AUTO_INCREMENT,\n    NomeUtente VARCHAR(100) NOT NULL,\n    Email VARCHAR(255) NOT NULL UNIQUE,\n    Telefono VARCHAR(20),\n    DataRegistrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE Prestito (\n    PrestitoID INT PRIMARY KEY AUTO_INCREMENT,\n    CopiaID INT NOT NULL,\n    UtenteID INT NOT NULL,\n    DataPrestito DATE NOT NULL DEFAULT CURRENT_DATE,\n    DataRestituzione DATE,\n    DataRestituzioneAttesa DATE NOT NULL,\n    CHECK (DataRestituzioneAttesa > DataPrestito),\n    CHECK (DataRestituzione IS NULL OR DataRestituzione >= DataPrestito),\n    FOREIGN KEY (CopiaID) REFERENCES Copia(CopiaID) ON DELETE RESTRICT,\n    FOREIGN KEY (UtenteID) REFERENCES Utente(UtenteID) ON DELETE RESTRICT\n);\n\nCREATE TABLE Multa (\n    MultaID INT PRIMARY KEY AUTO_INCREMENT,\n    PrestitoID INT NOT NULL,\n    Importo DECIMAL(10, 2) NOT NULL CHECK (Importo > 0),\n    DataMulta DATE DEFAULT CURRENT_DATE,\n    Pagata BOOLEAN DEFAULT FALSE,\n    FOREIGN KEY (PrestitoID) REFERENCES Prestito(PrestitoID) ON DELETE CASCADE\n);\n\n-- Indici per ottimizzare query comuni\nCREATE INDEX idx_libro_autore ON Libro(AutoreID);\nCREATE INDEX idx_libro_editore ON Libro(EditoreID);\nCREATE INDEX idx_libro_genere ON Libro(GenereID);\nCREATE INDEX idx_copia_libro ON Copia(LibroID);\nCREATE INDEX idx_prestito_utente ON Prestito(UtenteID);\nCREATE INDEX idx_prestito_copia ON Prestito(CopiaID);\nCREATE INDEX idx_prestito_data ON Prestito(DataPrestito, DataRestituzione);\nCREATE INDEX idx_multa_prestito ON Multa(PrestitoID);\nCREATE INDEX idx_utente_email ON Utente(Email);\n```\n\n### Query di Esempio\n\n```SQL\n-- Trovare tutti i libri di un autore specifico\nSELECT l.TitoloLibro, e.NomeEditore, l.AnnoPubblicazione\nFROM Libro l\nJOIN Autore a ON l.AutoreID = a.AutoreID\nJOIN Editore e ON l.EditoreID = e.EditoreID\nWHERE a.NomeAutore = 'Alessandro Manzoni'\nORDER BY l.AnnoPubblicazione DESC;\n\n-- Trovare prestiti scaduti non restituiti\nSELECT u.NomeUtente, u.Email, c.NumeroSeriale, \n       l.TitoloLibro, p.DataRestituzioneAttesa\nFROM Prestito p\nJOIN Utente u ON p.UtenteID = u.UtenteID\nJOIN Copia c ON p.CopiaID = c.CopiaID\nJOIN Libro l ON c.LibroID = l.LibroID\nWHERE p.DataRestituzione IS NULL \n  AND p.DataRestituzioneAttesa < CURRENT_DATE\nORDER BY p.DataRestituzioneAttesa ASC;\n\n-- Calcolare multe non pagate per utente\nSELECT u.NomeUtente, u.Email, COUNT(m.MultaID) AS NumeroMulte,\n       SUM(m.Importo) AS ImportoTotale\nFROM Multa m\nJOIN Prestito p ON m.PrestitoID = p.PrestitoID\nJOIN Utente u ON p.UtenteID = u.UtenteID\nWHERE m.Pagata = FALSE\nGROUP BY u.UtenteID, u.NomeUtente, u.Email\nHAVING SUM(m.Importo) > 0\nORDER BY ImportoTotale DESC;\n```\n\n## Conclusione\n\nLa progettazione di uno **schema SQL** solido è fondamentale per costruire sistemi di dati affidabili, efficienti e mantenibili. Applicando i principi di normalizzazione, scegliendo tipi di dati appropriati, definendo vincoli espliciti e creando indici strategici, stabilisci le basi per un'architettura di dati che scala e si adatta alle esigenze aziendali nel tempo.\n\nLa chiave è bilanciare la normalizzazione teorica con i requisiti pratici di performance, spesso accettando una denormalizzazione selettiva solo dove dimostrato necessario dai profili di workload.\n\n\n	\tLa progettazione di uno schema SQL solido è il fondamento di qualsiasi applicazione data-driven. Scopri come strutturare tabelle, definire relazioni (1:1, 1:N, M:N), implementare vincoli di integrità (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK), normalizzare i dati e evitare gli anti-pattern più comuni. Una guida pratica con esempi reali per costruire database scalabili, efficienti e manutenibili.	15	252	39	published	t	DKP-VAULT-CERT-ADMIN-M9SORZ	5ae8799bd88b8ae739a55553ce02bfb2722c67efc1dd3bd9873c84a816818586	4	1	2026-10-23 14:46:11.675304	2026-10-23 14:46:11.675304	["SQL", "PostgreSQL", "MySQL", "MariaDB", "SQL Server", "Database Design", "Data Modeling", "Relational Database", "Primary Key", "Foreign Key", "Normalization", "Data Engineering", "Schema Design", "Constraints", "Database Architecture", "SQLite", "ACID Properties", "Constraints & Integrity", "SQL Performance", "Entity Relationship", "Data Integrity"]
54	Come l'intelligenza artificiale sta cambiando il lavoro degli sviluppatori	come-l-intelligenza-artificiale-sta-cambiando-il-lavoro-degli-sviluppatori	# Introduzione\n\nL'intelligenza artificiale non è più una promessa del futuro – è una realtà tangibile che sta trasformando il modo in cui gli sviluppatori lavorano, apprendono e innovano. Nel 2026, gli sviluppatori che integrano strumenti AI nel loro flusso di lavoro quotidiano non sono più un'eccezione, ma una norma crescente.\n\nTuttavia, questa trasformazione solleva domande cruciali: **Quali competenze rimangono essenziali?** Come evolve il ruolo dello sviluppatore? **Quali opportunità e rischi emergono?**\n\nIn questo articolo analizzeremo in profondità come l'AI sta rimodellando il panorama dello sviluppo software, dalle pratiche quotidiane alle strategie di carriera a lungo termine.\n\n## Parte 1: Lo Stato Attuale dell'AI nel Development\n\n### L'Era degli AI Coding Assistants\n\nNegli ultimi tre anni, gli **AI coding assistants** hanno raggiunto una maturità straordinaria. Strumenti come **GitHub Copilot**, **Claude**, **ChatGPT**, **Gemini** e **Amazon CodeWhisperer** non sono più novelty: sono diventati estensioni naturali dell'IDE dello sviluppatore.\n\n**Cosa fanno questi strumenti**:\n\n| ==Funzionalità== | ==Descrizione== | ==Impatto== |\n|---|---|---|\n| **Code Completion** | Suggeriscono righe o interi blocchi di codice | Risparmia 30-40% del tempo di typing |\n| **Bug Detection** | Identificano errori comuni prima dell'esecuzione | Riduce i cicli debug |\n| **Refactoring Automatico** | Propongono miglioramenti strutturali del codice | Migliora qualità e leggibilità |\n| **Documentation Generation** | Crea commenti e documentazione | Accelera la documentazione |\n| **Test Writing** | Genera unit test e integration test | Aumenta copertura di test |\n| **Architecture Suggestions** | Propone pattern di design e architetture | Supporta decisioni architettoniche |\n\n---\n\n### Statistiche di Adozione (2026)\n- 72% degli sviluppatori utilizza almeno uno strumento AI durante il lavoro\n- 45% riferisce un aumento di produttività tra il 20-40%\n- 38% afferma che l'AI ha migliorato significativamente la qualità del codice\n- 28% ha ridotto il tempo di onboarding per nuovi progettisti\n- Le aziende tech leader riportano ROI positivo entro 3-6 mesi dall'implementazione\n\n## Parte 2: Come l'AI Trasforma il Flusso di Lavoro dello Sviluppatore\n\n### Fase 1: Progettazione e Planning\n\n**Prima dell'AI**:\n- Lunghe discussioni di design\n- Prototipazione manuale\n- Validazione attraverso trial-and-error\n**Con l'AI**:\n\n```Schema\nDeveloper → Descrizione naturale del requirement\n         → AI genera design patterns e pseudocode\n         → Developer valida e raffina\n         → Struttura architetturale pronta\n```\n**Esempio pratico**:\n\nPrompt all'AI: *"Voglio un sistema di autenticazione con JWT, refresh tokens, e rate limiting. Qual è la migliore architettura in Node.js?"*\n\nL'AI risponde con:\n- Diagramma dell'architettura\n- Structure di file consigliata\n- Boilerplate code pronto\n- Considerazioni di sicurezza\n- Metriche di performance\nRisultato: Cosa che prima richiedeva 2-3 giorni di ricerca ora viene completata in 30 minuti.\n\n### Fase 2: Implementazione\n\nL'AI accelera drammaticamente la fase di coding:\n\n```Js\n// Prima: Lo sviluppatore scrive manualmente\nasync function validateUserEmail(email, token) {\n  if (!email || !token) {\n    throw new Error('Missing parameters');\n  }\n  // 50+ linee di validazione manuale...\n}\n\n// Con GitHub Copilot: Suggerisce l'intera implementazione\n// Basta scrivere il nome della funzione e Copilot completa\n```\nBenefici concreti:\n1. **Velocità di sviluppo**: Incremento del 25-50% nella velocity\n2. **Riduzione errori boilerplate**: Eliminazione di bug ricorrenti\n3. **Coerenza del codice**: AI mantiene stili e pattern uniformi\n4. **Conoscenza distribuita**: Nuovi developer accedono a best practice\n\n### Fase 3: Testing e Debugging\n\nAI-assisted Test Generation:\n\n```Js\n// Dato questo codice:\nfunction calculateDiscount(price, customerType) {\n  if (customerType === 'premium') return price * 0.8;\n  if (customerType === 'regular') return price * 0.9;\n  return price;\n}\n\n// L'AI genera automaticamente test completi:\ndescribe('calculateDiscount', () => {\n  test('applies 20% discount for premium customers', () => {\n    expect(calculateDiscount(100, 'premium')).toBe(80);\n  });\n  \n  test('applies 10% discount for regular customers', () => {\n    expect(calculateDiscount(100, 'regular')).toBe(90);\n  });\n  \n  test('applies no discount for unknown customer types', () => {\n    expect(calculateDiscount(100, 'unknown')).toBe(100);\n  });\n  \n  test('handles edge cases with zero and negative prices', () => {\n    expect(calculateDiscount(0, 'premium')).toBe(0);\n    expect(calculateDiscount(-100, 'premium')).toBe(-80);\n  });\n});\n```\nDebugging Assistito:\n\n```Schema\nStack Trace → AI Tool → Analisi Root Cause → Suggerimenti di Fix\n```\nAd esempio, di fronte a un errore di memory leak, l'AI può:\n- Identificare le cause probabili\n- Suggerire refactoring\n- Proporre monitoring e alerting\n- Raccomandare pattern alternativi\n\n### Fase 4: Code Review e Quality Assurance\n\n==L'AI sta trasformando la peer review==\n\n**AI Code Review Bot**:\n- Controlla style guide automaticamente\n- Identifica vulnerabilità di sicurezza\n- Suggerisce ottimizzazioni di performance\n- Verifica best practice specifiche del dominio\n- Riduce il carico sui reviewer umani\n\n```Schema\nDeveloper invia PR → AI bot review automatica\n                  → Umani reviewano AI feedback\n                  → Merge più veloce e consapevole\n```\n\n## Parte 3: Le Competenze che Rimangono (e Quelle che Cambiano)\n\n### Competenze in Declino Relativo\n\n| ==Competenza== | \t==Status== | ==Perché== |\n|---|---|---|\n| **Memorizzazione di sintassi** | ⬇️ Bassa priorità | \tL'AI conosce syntax meglio dell'uomo |\n| **Boilerplate coding** | ⬇️ Automatizzato | Generato da AI tools |\n| **Debug manuale di base** | ⬇️ Supportato da AI | Richiede ancora expertise, non ricerca |\n| **Ricerca su StackOverflow** | ⬇️ Ridotta | L'AI sintetizza risposte più velocemente |\n\n---\n\n### Competenze Ancora Critiche\n**1. Problem-Solving Strategico**\nL'AI non risolve problemi complessi – li supporta. Lo sviluppatore deve:\n- Definire il problema chiaramente\n- Valutare soluzioni AI proposte\n- Prendere decisioni architettoniche\n\n**2. Comprensione del Dominio Business**\n\n```Schema\nAI Generico + Comprensione del Business = Soluzioni Eccellenti\n```\nUno sviluppatore che conosce il contesto business può:\n- Fare domande migliori all'AI\n- Valutare se la soluzione AI soddisfa realmente il business need\n- Anticipare edge case specifici del dominio\n\n### 3. Sicurezza e Compliance\nL'AI può introdurre vulnerabilità senza accorgersene:\n\n```Js\n// AI suggerisce una soluzione comoda, ma potenzialmente insicura\nfunction getUserData(userId) {\n  // SQL Injection Risk se non validato correttamente\n  return db.query(`SELECT * FROM users WHERE id = ${userId}`);\n}\n\n// Lo sviluppatore deve riconoscere il rischio e correggerlo\n```\n### 4. Architettura e Design Decisions\n- Scalabilità\n- Trade-offs tecnologici\n- Decisioni di tech stack\n- Implementazione di pattern avanzati\n\n### 5. Soft Skills e Leadership\nL'AI non può:\n- Comunicare con stakeholder\n- Gestire team\n- Negoziare requisiti\n- Mentorar junior developer\n\n### Competenze Emergenti e in Crescita\n**1. Prompt Engineering**\nLa capacità di formulare prompt chiari e specifici è ormai competenza core:\n\n```Python\n# Prompt scarso:\n"Scrivi una funzione di login"\n\n# Prompt eccellente:\n"""\nScrivi una funzione di login in Python che:\n- Accetta email e password\n- Valida il formato dell'email\n- Hash della password con bcrypt (costo 12)\n- Ritorna JWT con expiry di 1 ora\n- Implementa rate limiting (max 5 tentativi)\n- Registra tentativi falliti per sicurezza\n- Gestisci errori con messaggi specifici\n- Include type hints\n- Scrivi anche unit test\n"""\n```\n**2. AI Model Understanding**\nComprendere limiti e capacità dei modelli:\n- Quando l'AI funziona bene\n- Quando fallisce\n- Come interpretare confidence score\n- Quando richiedere review umana\n\n**3. Ethical AI Development**\n- Bias detection nel codice generato\n- Privacy compliance\n- Fairness nelle AI-generated solutions\n- Trasparenza dei model provider\n\n**4. Infrastructure e DevOps**\nCon AI che genera codice, la differenziazione si sposta a:\n- Deployment automatizzato\n- Monitoring e observability\n- Infrastruttura scalabile\n- CI/CD pipelines sofisticati\n\n## Parte 4: Opportunità Concrete per gli Sviluppatori\n\n### 1. Specializzazione Tecnica\nGli sviluppatori possono specializzarsi in domini dove l'AI non è ancora dominante:\n\n**Machine Learning Engineering**\n- Sviluppare modelli AI custom\n- Fine-tuning di LLM\n- MLOps e deployment modelli\n- Competenza ancora rara e bien pagée\n\n**Sistema Distribuiti e Infrastruttura**\n- Architetture complesse di sistema\n- Performance optimization\n- Database design\n- Cloud infrastructure\n\n**Security Specialist**\n- Secure coding practices\n- Penetration testing\n- Compliance frameworks\n- Zero-trust architecture\n\n### 2. AI-Augmented Development as Service\n\nUna nuova categoria di servizi emerge:\n\n```Schema\nTraditional Dev Team: 5 developer → 1 mese\nAI-Augmented Team: 2 developer + AI tools → 1 settimana\n```\nQuesto permette:\n- Agenzie più piccole di scalare velocemente\n- Startup di muoversi più velocemente\n- Di fare più progetti in meno tempo\n\n### 3. Full-Stack Developer Renaissance\nCon AI che gestisce boilerplate:\n\n```Schema\nTradizionalmente: Frontend dev ≠ Backend dev (skill set distinti)\nCon AI: Lo stesso developer può essere efficace in full-stack\n```\nQuesto aumenta la versatilità e il valore di un developer.\n\n### 4. Focus su High-Value Work\nIl tempo non speso in task ripetitivi può essere investito in:\n- Research e innovazione\n- Mentorship di junior\n- Community contribution\n- Side projects e learning\n\n## Parte 5: I Rischi e le Sfide\n\n### Rischio 1: Over-Reliance su AI\n**Il Problema:**\n\n```Schema\nDeveloper scrive meno codice\n  ↓\nDeveloper capisce meno il codebase\n  ↓\nQuando AI sbaglia, developer non sa come fixare\n  ↓\nSituazioni critiche diventano critiche\n```\n**Soluzione:**\n- Mantenere competenze fondamentali\n- Revieware attentamente AI suggestions\n- Implementare code review rigorosi\n- Testing completo\n\n### Rischio 2: Security e Privacy\n\nL'AI introduce nuovi vettori di attacco:\n\n```Js\n// Concern 1: Codice generato può avere vulnerabilità\n// Concern 2: Codice sorgente inviato a server esterni\n// Concern 3: LLM addestrati su dati pubblici\n// Concern 4: Possibili breech di IP aziendale\n```\n**Mitigazioni:**\n- Usare AI tool self-hosted per codice sensibile\n- Implementare data masking\n- Audit regolari del codice generato\n- Conformità GDPR/privacy\n\n### Rischio 3: Disoccupazione Tecnologica\n**Scenario temuto:**\n- Se l'AI può generare code, servono meno developer?\n\n**Realtà più sfumata:**\n- Richiesta totale di development cresce (costo ridotto)\n- Developer meno esperti sono sostituiti più facilmente\n- Junior developer devono acquisire skills rapidamente\n- Esperienza e judgment rimangono preziosi\n\n**Timeline storico parallelo:**\n\n```Schema\nDatabase automation → Non eliminò DBA, ma trasformò il ruolo\nCloud computing → Non eliminò System Admin, evolvette\nDevOps tooling → Non eliminò developer, aumentò produttività\n```\n\n## Parte 6: Come Prepararsi nel 2026\n\n### Per Junior Developer\nFase 0-6 mesi:\n- **Fondamenta solide**: Imparare CS fundamentals\n- L**inguaggio di programmazione**: Padroneggiare un linguaggio profondamente\n- **Problem solving**: Risolvere problemi senza AI per capire i fondamenti\n- **Non dipendere completamente da AI**: La fondazione deve essere vostra\n\nFase 6-12 mesi:\n- Iniziare a usare AI tool (GitHub Copilot, etc.)\n- Imparare prompt engineering\n- Contribuire a open source\n- Specializzarsi in un'area\n\n### Per Mid-Level Developer\nStrategy di Adattamento:\n- **Padroneggiare AI tools**: Diventare expert di prompt engineering\n- **Specializzazione**: Identificare un dominio dove AI non è dominante\n- **Leadership**: Iniziare a mentorare junior, definire standard di AI usage\n- **Business Knowledge**: Approfondire comprensione del business\n- ** Automatizzazione infra**: Acquisire skills DevOps/SRE\n\nEsempio Timeline:\n\n```\nMese 1-2: GitHub Copilot mastery\nMese 3-4: Prompt engineering certification\nMese 5-6: Specializzazione (es. ML Engineering, Security, Infra)\nMese 7+: Leadership e mentorship\n```\n### Per Senior Developer / Tech Lead\nRuolo in evoluzione:\n\n```Schema\nCoding 40%  →  Coding 20%\n        ↓\n    Architecture 30%  →  Architecture 40%\n    Mentoring 20%  →  Mentoring 30%\n    Strategic Planning 10%  →  Strategic Planning 10%\n```\nCompetenze da sviluppare:\n- **AI Governance**: Definire policy su quale AI tool usare\n- **Team Augmentation**: Guida il team nell'adozione di AI\n- **Ethical Decision Making**: Navigare questioni etiche di AI usage\n- **Business Strategy**: Capire come AI impatta product e business model\n\n## Parte 7: Prospettive Aziendali\n\n### Come le Aziende Stanno Rispondendo\nEarly Adopters (10% di aziende)\n\nCaratteristiche:\n- Tech leader e scale-up ben finanziate\n- Culture d'innovazione già consolidata\n- Budget dedicato a sperimentazione\n\nAzioni implementate:\n- Licenze GitHub Copilot Enterprise per interi team\n- Creazione di internal AI policies\n- Investimento in AI training per developer\n- Custom fine-tuned models per dominio specifico\n- Dedicated AI governance committee\n\nRisultati misurati:\n- Velocità development +35-50%\n- Code quality score +20-30%\n- Time-to-market ridotto di 2-3 settimane per sprint\n- Onboarding nuovo developer ridotto da 3 mesi a 6 settimane\n\nAziende di riferimento:\n- **Google, Meta, Microsoft**: Utilizzano AI per internal development\n- **Stripe, Figma**: Hanno annunciato investment in AI-assisted coding\n- **Startups finanziate VC**: Adozione >80% entro 18 mesi\n\n### Followers (60% di aziende)\n\nCaratteristiche:\n- Aziende mid-size e enterprise tradizionali\n- Adozione cauta ma progressiva\n- Preoccupazioni su security e compliance\n\nFase di implementazione (2026):\n\n| ==Timeline== | ==Azione== |\n|---|---|\n| **Trimestre 1** | Pilot project con team selezionato |\n| **Trimestre 2** | Valutazione risultati e ROI |\n| **Trimestre 3** | Rollout graduale con policy chiare |\n| **Trimestre 4** | Integrazione in standard development |\n\nPolitiche comuni che stanno adottando:\n\n```\n✓ AI tools consentiti SOLO su code interno non-sensibile\n✓ Veto su GitHubCopilot per: codice di payment, auth, crypto\n✓ Tutti i suggerimenti AI devono essere reviewati da umano\n✓ Obbligo di training su prompt engineering e AI risks\n✓ Auditing regolare del codice AI-generated\n✓ Masking di dati sensibili prima di inviare a AI cloud\n✓ Self-hosted solution preferite quando possibile\n```\nChallenge principali:\n- Navigare compliance (GDPR, HIPAA, SOC2)\n- Identificare tool safe per loro contesto\n- Training diffuso del team\n- Definire metriche di success\n\n### Laggards (30% di aziende)\n\nCaratteristiche:\n- Aziende legacy-focused\n- Risk-averse\n- Budget limitato per innovation\n\nAtteggiamento (ancora nel 2026):\n- "Aspettiamo che le soluzioni maturino"\n- Preoccupazioni su job security dei developer\n- Dubbi sulla sicurezza e stabilità di AI tool\n- Cost-benefit non ancora convincente\n\nTrend di cambio:\n- Competizione li forzerà ad adattarsi\n- Talento tech migra verso aziende AI-forward\n- Velocity dei competitor diventa insostenibile\n- Pressure da C-suite per modernizzazione\n\nTimeline probabile:\n- **2026-2027**: Inizio piloti\n- **2027-2028**: Adozione mainstream\n- **2029+**: Standard di industria\n\n## La Trasformazione dei Ruoli in Azienda\n\n### Developer Role Evolution\n\n```Schema\n2020: Developer\n  ├─ Coding (80%)\n  ├─ Debugging (10%)\n  └─ Meetings (10%)\n\n2026: AI-Augmented Developer\n  ├─ Code review & validation (40%)\n  ├─ Architecture & design (25%)\n  ├─ Coding (20%)\n  ├─ Prompt engineering (10%)\n  └─ Knowledge sharing (5%)\n\n2030 (projected): AI-Integrated Developer\n  ├─ Strategic decisions (35%)\n  ├─ Complex problem solving (30%)\n  ├─ AI supervision & governance (20%)\n  ├─ Innovation & R&D (10%)\n  └─ Direct coding (5%)\n```\n### Nuovi Ruoli Emergenti\n\n**1. AI Prompt Engineer**\n- Specializzazione di developer senior\n- **Stipendio**: $120k-160k (2026)\n- **Skills**: NLP understanding, communication clarity, domain expertise\n\n**2. AI Governance Officer**\n- Responsabile di policy AI in azienda\n- Garantisce compliance e security\n- Audita codice generato\n- Stipendio: $130k-180k\n\n**3. ML Ops / LLM Infrastructure Engineer**\n- Deploy e manage custom AI models\n- Optimization di inference cost\n- Fine-tuning e retraining\n- Stipendio: $140k-190k\n\n**4. AI Code Quality Auditor**\n- Verifica sicurezza codice generato\n- Test e validation\n- Documento vulnerabilità\n- Stipendio: $100k-150k\n\n**5. Developer Advocate for AI Tools**\n- Evangelista interno\n- Training e onboarding\n- Best practice documentation\n- Stipendio: $110k-160k\n\n## Impact Economico e di Mercato\n\n### Market Sizing\n\nAI Developer Tools Market (2026):\n- **Market size**: $5.2 Billion\n- **CAGR (2023-2026)**: 67%\n- **Proiezione 2030**: $28+ Billion\n\nSegmentazione:\n\n| ==Segmento== | ==Percentuale Market== | ==Growth== |\n|---|---|---|\n| **Code Completion** | 45% | +55% YoY |\n| **Testing & QA** | 25% | +55% YoY |\n| **Documentation** | 15% | +75% YoY |\n| **Refactoring** | 10% | +90% YoY |\n| **Architecture** | 5% | +120% YoY |\n\n---\n\n### Impatto sul Salario dei Developer\n\nPrevisioni salariali 2026 per ruoli US:\n\n| ==Seniority== | ==Senza AI Skills== | ==Con AI Skills== | ==Delta== |\n|---|---|---|---|\n| **Junior** | \t$70k-85k | $85k-105k | +21% |\n| **Mid-level** | $110k-140k | $135k-170k | +25% |\n| **Senior** | $160k-200k | $190k-250k | +28% |\n| **Principal** | $220k-280k | $280k-380k | +35% |\n\n**Insight**: Developer con AI expertise guadagnano premium significativo.\n\n## Scenari Futuri: 2027-2030\n\n### Scenario A: Accelerazione Positiva (60% probabilità)\n\n```\n2027: AI tool adoption rate 85% tra developer\n      Nuove competenze standardizzate in bootcamp\n      Ridefinizione role specializzazione\n\n2028: Nascita di AI-native development frameworks\n      Developer productivity +60% vs 2024\n      Skill shortage in specialization areas\n\n2029: AI pair programming è lo standard\n      Development cost per feature -50%\n      Startup velocità aumentata 3-4x\n\n2030: Senior + Junior + AI = Team productivity pre-AI Senior team\n      Focus shift to innovation vs execution\n```\nImplicazioni:\n- Crescita economica nel software\n- Più startup, più innovation\n- Developer con skill acquisition rimangono richiesti\n- Competitive pressure aumenta\n\n### Scenario B: Plateau Controlato (30% probabilità)\n\n```\n2027-2028: Adozione stabile ~70%\n           Concern su security e quality rimangono\n           Regulation inizia a emergere\n\n2029: Standardizzazione di best practice\n      AI tool stabilization\n      Incremento moderato di productivity\n\n2030: AI come utility, non come magic\n      Focus su human oversight e governance\n      Developer role stabile con augmentation\n```\nImplicazioni:\n- Adozione graduale e sostenibile\n- Meno disruption ai mercati del lavoro\n- Regolamentazione fornisce clarity\n- Hybrid teams rimangono norma\n\n### Scenario C: Backlash e Consolidamento (10% probabilità)\n\n```\n2027: Emergono security breaches e quality issues\n      Lawsuit su AI-generated code\n      Privacy concern crescono\n\n2028: Regulation stringente limita AI usage\n      Market consolida su few trusted player\n      Pricing aumenta significativamente\n\n2029: Backlash su AI tool, return to manual\n      Developer skills ritornano in focus\n      Innovation ralenta\n\n2030: AI è strumento di nicchia\n      Settori regolati vietano AI code\n      Manual development rimane dominante\n```\nProbabilità bassa ma possibile se emergono problemi di sicurezza maggiori.\n\n## Consigli Strategici per Aziende nel 2026\n\n### Per CTO / Tech Lead\n\n**Decisioni immediate (Q1-Q2 2026)**:\n-  Scegliere AI Tool Stack\n\n```\n✓ Valutare: GitHub Copilot Enterprise, Claude, ChatGPT API\n✓ Considerare: Self-hosted options se data sensitivity alta\n✓ Budget: Calcolare ~$30-50 per developer/mese\n```\n-  Implementare AI Governance Policy\n\n```\n✓ Definire allowed use cases\n✓ Security requirements\n✓ Code review procedures\n✓ Compliance checkpoints\n```\n- Implementare Training\n\n```\n✓ Prompt engineering basics (8 ore)\n✓ Security e compliance specifici (4 ore)\n✓ Ongoing workshops mensili\n✓ Internal knowledge base su best practice\n```\n\n### Per HR / Talent Acquisition\n\n**Strategy di 2026**:\n- Job Description Update\n\n```\nOLD: "Expert in Python and JavaScript"\nNEW: "Expert in Python and JavaScript + \n      Proficient with AI-assisted development tools +\n      Understanding of prompt engineering"\n```\n- Hiring Criteria\n\n```\n✓ Technical fundamentals (still essential)\n✓ Adaptability e learning agility\n✓ AI tool familiarity (preferred)\n✓ Communication skills (increasingly important)\n```\n- Salary Positioning\n\n```\n✓ Offrir premium per AI skills\n✓ Investire in reskilling existing team\n✓ Competitor benchmarking su AI expertise\n```\n-  Retention\n\n```\n✓ Offrire learning opportunities\n✓ Career progression chiara con AI specialization\n✓ Flessibilità nel tool usage\n✓ Recognition per AI expertise\n```\n\n### Per Founder / Startup\n\n**Competitive Advantage**:\n\n```\nTraditional Dev Team: 5 senior developer\n                     1-2 anni to MVP\n                     $400k/anno cost\n\nAI-Augmented Team: 2 senior + 2 mid-level developer\n                   4-6 mesi to MVP\n                   $300k/anno cost\n                   \nADVANTAGE: Velocità + Cost efficiency = Market timing edge\n```\nAction items:\n\n**Embracing AI from day one**\n- Hiring AI-proficient developer\n- Choosing AI-friendly tech stack\n- Building AI tools usage into culture\n\n**Competitive differentiation**\n- Faster iteration cycles\n- Ability to do more with less\n- Innovation velocity increase\n\n**Investor appeal**\n- Modern development practices\n- Cost-efficient operations\n- Scalable growth trajectory\n\nL'intelligenza artificiale sta rimodellando il panorama aziendale del development software non come sostituto dei developer, ma come moltiplicatore di capacità e acceleratore di innovation.\n\n**Le aziende che oggi investono in**:\n- Adozione strategica di AI tool\n- Training e reskilling del team\n- Governance e best practice\n- Specializzazione e innovazione\n...saranno le leader del mercato nel 2028-2030.\n\n**Al contrario, aziende che ignorano questa trasformazione affronteranno**:\n- Velocity competitiva ridotta\n- Talent drain verso competitor AI-forward\n- Obsolescenza tecnica accelerata\n- Market share erosion\n**Il messaggio finale**: Non è una questione di **"se"** adottare AI nel development, ma **"quando"** e **"come"** farlo in modo responsabile e strategico.\n\n# Conclusione Generale\n\n## Come l'IA Sta Trasformando il Lavoro degli Sviluppatori: Una Prospettiva Integrata\n\nSiamo a un punto di inflessione storico nel software development. A differenza delle precedenti ondate di automazione che hanno eliminato ruoli specifici, l'intelligenza artificiale sta augmenting il developer, non sostituendolo – ma solo per chi sa adattarsi.\n\n### Il Quadro Sintetico\n\n**Nei capitoli precedenti abbiamo esplorato come l'AI trasforma**:\n- Il flusso di lavoro quotidiano (design, coding, testing, deployment)\n- Le competenze richieste (quali diminuiscono, quali rimangono essenziali, quali emergono)\n- Le opportunità di carriera (specializzazione, leadership, nuovi ruoli)\n- I rischi e le sfide (over-reliance, security, disruption economica)\n- Le strategie di preparazione (per junior, mid-level, senior developer)\n- L'impatto aziendale (organizzazione, salari, innovazione, mercato)\n\nUn pattern emerge chiaramente: L'AI non è il fine, ma il mezzo per raggiungere un obiettivo più grande – l'accelerazione dell'innovazione tecnologica.\n\n## I Tre Megatrend in Atto\n\n### 1. La Democratizzazione del Development\n\n```\nCosa richiedeva: PhD in CS + 10 anni di esperienza\nOra richiede: Comprensione del dominio + Prompt engineering\nRisultato: Più persone possono contribuire alla creazione di software\n```\n**Questa democratizzazione ha effetti paradossali**:\n- **Opportunità**: Barriere di ingresso ridotte; talent pool ampliato\n- **Sfida**: Qualità media potrebbe calare inizialmente; competizione aumenta\n\n**Per il developer**: Chi sa mantenere standard di qualità elevati rimane differenziato.\n\n###2. Lo Shift da Execution a Strategy\n\n```\n2020: Developer = Person who writes code\n2026: Developer = Person who makes strategic decisions about code\n\nCoding è diventato commoditized. Strategic thinking è no.\n```\nIl tempo risparmiato in typing e debugging è reinvestito in:\n- Decisioni architettoniche\n- Code review di qualità\n- Mentorship e knowledge transfer\n- Innovation e R&D\n- Business acumen\n**Per il developer**: Il valore non risiede più nella velocità di coding, ma nella qualità delle decisioni.\n\n###3. La Specializzazione Forzata\n\n```\nGeneralista full-stack diventava obsoleto?\nNO. Diventava necessariamente anche specialista in qualcosa.\n\nAI gestisce l'80% del codice generico.\nIl 20% rimanente richiede expertise profonda.\n```\nPercorsi di carriera contemporanei:\n\n```\nPath A: Full-Stack + ML Engineering (specializzazione)\nPath B: Cloud Architecture + DevOps (specializzazione)\nPath C: Security & Compliance (specializzazione)\nPath D: Product Engineering + Business Strategy (specializzazione)\n\nNon esiste più il "Developer generico puro" nel 2026+\n```\n## La Realtà delle Competenze nel 2026\n\n### Cosa l'AI Ha Cambiato Irrevocabilmente\n\n✅ **Code Boilerplate** → Completamente automatizzato\n✅ **Bug Detection Routine** → AI trova 60-70% dei bug comuni\n✅ **Documentation** → Generata automaticamente\n✅ **Test Writing** → Greatly accelerated\n✅ **Syntax Lookup** → Obsoleto (chiedi all'AI)\n✅ **Learning Curve Iniziale** → Ridotta di 30-40%\n\n### Cosa Rimane Esclusivamente Umano\n\n🧠 **Architectural Decisions** → AI suggerisce, umano decide\n🧠 **Tradeoff Analysis** → Richiede contesto, intuizione, esperienza\n🧠 **Business Understanding** → Trasla il valore del developer\n🧠 **Team Leadership** → Non automizzabile\n🧠 **Ethical Judgment** → Responsabilità rimane umana\n🧠 **Innovation** → AI supporta, umano crea nuove direzioni\n🧠 **Communication** → Skill sempre più preziosa in team distributed\n\n### La Nuova Frontiera: Prompt-Driven Development\n\nUna competenza completamente nuova ha raggiunto status di core skill:\n\n```Python\n# Cattivo prompt:\n"Scrivi una funzione di login"\n\n# Buono prompt:\n"""\nCrea una funzione di login robusta in Python che:\n- Accept email/password in HTTPS request\n- Validate email format and password strength\n- Hash password using bcrypt (cost 12)\n- Return JWT token with 1-hour expiry\n- Implement rate limiting (5 attempts per minute)\n- Log failed attempts for security audit\n- Handle all edge cases (missing fields, invalid format, etc)\n- Include type hints for all parameters\n- Write comprehensive unit tests with >90% coverage\n"""\n\n# Eccellente prompt:\n"""\nContesto:\n- E-commerce platform con 1M users\n- Multi-region deployment (need for distributed session handling)\n- Compliance: PCI-DSS, GDPR\n\nRequisiti:\n- Login function deve:\n  1. Support email/password authentication\n  2. Enforce strong password policy (min 12 char, special char)\n  3. Implement 2FA option for high-value accounts\n  4. Handle distributed cache for rate limiting\n  5. Generate JWT con refresh token rotation\n  6. Log security events per audit trail\n  7. Integrate con fraud detection system\n  \nConstraints:\n- <100ms latency (p99)\n- Zero tolerance per data breach\n- GDPR compliance mandatory\n- Future-proof architecture per migration to SSO\n\nTecnologia:\n- Python 3.11\n- FastAPI framework\n- PostgreSQL + Redis\n- Existing codebase pattern: [describe]\n\nOutput:\n- Implementation con error handling\n- Unit tests (>95% coverage)\n- Integration tests per OAuth/SSO future\n- Documentation sulla decisione di design\n- Security considerations\n"""\n```\nLa qualità del prompt determina la qualità della soluzione. Questo è una skill, non una coincidenza.\n\n## Scenari Personali: Come Questo Può Impattare \n\n### Scenario 1: Junior Developer (0-2 anni di esperienza)\n\n**Situazione nel 2026**:\n\n```\nPro:\n✓ Accedi a knowledge artificiale infinita (AI di fatto funge da senior)\n✓ Puoi imparare stack moderno in 6 mesi invece di 18\n✓ Boilerplate non è più ostacolo\n✓ Onboarding è più veloce\n\nContro:\n✗ Competizione dalla gente che usa AI meglio\n✗ Risk di diventare "cargo cult developer" (copy-paste senza capire)\n✗ Se non impari fundamentals, rimani junior per sempre\n✗ Market saturation di junior developer mediocri\n```\nStrategia di successo:\n- Imparare fundamentals profondamente (non saltare questa fase)\n- Usare AI per accelerare, non per sostituire l'apprendimento\n- Focalizzarsi su problem-solving vs syntax\n- Contribuire a open source (differenziazione vs AI-generated code)\n- Specializzarsi presto (ML, infra, security) per staccarsi dalla massa\n\n### Scenario 2: Mid-Level Developer (3-7 anni)\n\n**Situazione nel 2026**:\n\n```\nPro:\n✓ Productivity +30-40% con AI tools\n✓ Più tempo per impact work\n✓ Promosso a senior più facilmente se hai leadership\n✓ Skills in AI governance altamente ricercate\n\nContro:\n✗ Pressione a deliver di più in meno tempo\n✗ Expectation di upskilling costante\n✗ Seniore senza specializzazione è a rischio\n✗ Junior developer con AI potrebbero colmare il gap\n```\n**Strategia di successo**:\n- Master di AI tools (diventa expert di Copilot, Claude, etc)\n- Acquisire specializzazione tecnica (scegli un dominio, approfondisci)\n- Sviluppare leadership (mentorar junior, guide team)\n- Business acumen (capire come technology impatta business)\n- Visible impact (comunicare bene il tuo valore)\n\n### Scenario 3: Senior / Staff Engineer (8+ anni)\n\n**Situazione nel 2026**:\n\n```\nPro:\n✓ Tua experience è ancora critica (AI non può replicare judgment)\n✓ Leadership role è in forte demand\n✓ Specializzazione + seniority = massima valutazione\n\nContro:\n✗ Expectation di guidare AI adoption strategically\n✗ Non puoi più ignorare AI (devi capirla e gestirla)\n✗ Ruolo si sposta verso meno coding, più decision-making\n✗ Competizione da sviluppatori mid-level + AI augmented\n```\n**Strategia di successo**:\n- Governance e strategy (definire come team usa AI)\n- Architecture di sistemi (dove AI non arriva)\n- Mentorship at scale (non solo 1-1, ma moltiplicare impatto)\n- Innovation leadership (identificare opportunità AI nel business)\n- Vendor/community engagement (stay at forefront of trends)\n\n## Domande Chiave da Porsi Oggi (2026)\n\n### Per te come Developer:\n\n**1. Quanto sono profonda le mie competenze fundamentals?**\n\n```\nSe l'AI fosse bannata domani, potrei comunque essere efficace?\nSe no → Priorità: Fondazioni solide\nSe sì → Priorità: Specializzazione\n```\n**2. Sto imparando o mi sto fossilizzando?**\n\n```\nUltimi 6 mesi: Ho imparato qualcosa di nuovo?\nSì → Su track corretto\nNo → Red flag, time to invest in learning\n```\n**3. La mia specializzazione è defensible?**\n\n```\nPotrebbe un junior con AI fare il mio lavoro in 2 anni?\nSì → Specializzati di più o pivota\nNo → Continua a costruire su fondazioni solide\n```\n**4. Conosco il business dove lavoro?**\n\n```\nPotrei spiegare come il mio codice genera revenue?\nNo → Time to learn business acumen\nSì → Leverage questo knowledge come differenziatore\n```\n\n### Per te come Manager/CTO:\n\n**1. La mia organizzazione ha AI strategy chiara?**\n\n```\nQuali tool abbiamo adottato?\nQuale il ROI misurato?\nSe non misuriamo → First step: metriche concrete\n```\n**2. Il mio team è allineato su AI governance?**\n\n```\nTutti sanno quando usare/non usare AI?\nEsiste policy scritta?\nSe no → Crea framework subito\n```\n**3. Sto investendo in reskilling?**\n\n```\nQuante ore di training per developer per AI tools?\nTarget: 20-30 ore/anno per tutti\nReality check: Probabilmente <5 ore/anno in media\n```\n**4. Riesco ad attrarre e trattenere talento AI-proficient?**\n\n```\nCompensation competitive per AI expertise?\nCareer path chiaro per specializzazione?\nSe no su entrambi → Risk di talent drain\n```\n### Il Verdict Finale: Chi Vince in questo Nuovo Mondo?\n\n**Developer che Vincono**:\n\n```\nProfondità Tecnica + Adaptabilità + Business Acumen + Communication Skills\n\nCaratteristiche:\n✓ Continua a imparare (non festina su laureli passati)\n✓ Specializzato in qualcosa (full-stack generico è no)\n✓ Capisce il business, non solo la tecnologia\n✓ Comunica bene (spiega decisioni tecniche a non-technical)\n✓ Adopta AI strategicamente (non come crutch)\n✓ Mantiene il rigore tecnico (AI suggestion ≠ auto-accept)\n✓ Contribuisce oltre il codice (mentoring, community, innovation)\n```\n**Developer che ne Risentono**:\n\n```\nSpecialista unico + Rigido + Tecnico puro + Isolato\n\nCaratteristiche:\n✗ "Sempre fatto così, perché cambiare?"\n✗ No specializzazione chiara (generico e basta)\n✗ Non capisce business context\n✗ Difficilmente comunica idee\n✗ Resiste a tool nuovi (o li adora ciecamente)\n✗ Accetta tutto ciò che l'AI suggerisce\n✗ Solo code, no leadership o growth\n```\n**Aziende che Vincono**:\n\n```\nAI Adoption + Talent Investment + Clear Strategy + Quality Focus\n\nAzioni:\n✓ Tool AI adottate e misurate\n✓ Team trainato su prompt engineering e governance\n✓ Policy chiara su allowed/disallowed use cases\n✓ Code quality non sacrificata per velocity\n✓ Specialization encouraged and rewarded\n✓ Leadership development for AI era\n✓ Culture di continuous learning\n```\n**Aziende che Risentono**:\nNo Strategy + Cost Cutting + Blind Adoption + No Governance\n\nAzioni sbagliate:\n✗ "Compra AI tool e basta" (no training)\n✗ Riduce team credendo AI fa tutto\n✗ Accetta tutto il codice AI-generated (no review)\n✗ No career development plan\n✗ Talent fleeing al competitor\n✗ Technical debt aumenta\n✗ Quality issues accumulated\n\n## Il Messaggio Finale\n\n### L'intelligenza artificiale nel 2026 non è una minaccia al developer – è una scelta.\n\nPuoi scegliere di:\n\n**Opzione A**: Resistenza\n\n```\n"L'AI non è reliable, preferisco fare da solo"\nOutcome: Progressivamente meno competitivo\nTimeline: 12-24 mesi before significant impact\n```\n**Opzione B**: Adoption Cieca\n\n```\n"Uso AI per tutto, così sono super produttivo"\nOutcome: Fragile systems, knowledge gaps, long-term career risk\nTimeline: 6-12 mesi before problems emerge\n```\n**Opzione C**: Integrazione Consapevole ✅\n\n```\n"Uso AI strategicamente per augmentare le mie skills,\n mantiengo rigore tecnico, continuo a imparare profondamente,\n specializzarmi in aree dove l'AI non arriva"\nOutcome: Massimo valore professionale + job security\nTimeline: Vantaggio competitivo visibile in 6 mesi\n```\n## Esercizi Pratici \n\n### Prossimi Passi Concreti\n\n**Questa settimana (se non l'hai già fatto)**:\n\n**A.** ✅ Installa uno strumento AI (GitHub Copilot, Claude, o simile)\n**B.** ✅ Scrivi il tuo primo prompt (non triviale, almeno 200 caratteri)\n**C.** ✅ Valuta il risultato criticamente (è buono? Ha bug? Cosa manca?)\n\n**Questo mese**:\n**A.** ✅ Leggi un articolo tecnico (senza usare AI per leggerlo, capiscilo profondamente)\n**B.** ✅ Contribuisci a un progetto open source (dimostra che puoi pensare oltre il codice AI-generated)\n**C.** ✅ Parla con un collega senior (quali competenze secondo loro rimangono critica nel 2027-2028?)\n\n**Questo trimestre**:\n**A.** ✅ Specializzati in un'area (identifica una skills che l'AI non copre bene nel tuo dominio)\n**B.** ✅ Mentorar qualcuno (insegna loro a usare AI + pensiero critico)\n**C.** ✅ Impara il business della tua azienda (come fa revenue? Quali i margini? Chi sono i competitor?)\n\n## Concludendo in generale: L'AI come "Augmentation", non Replacement\n\nNel 1995, quando Internet era nascente, un expert di database poteva cavarsela ignorando completamente il web. Nel 2005, era già troppo tardi – il web aveva ridisegnato l'intero panorama del software.\n\nSiamo di nuovo a un simile punto di inflessione nel 2026.\n\n**Chi ignora l'AI nel 2026 avrà lo stesso problema nel 2028 che aveva il database expert con il web nel 2007** – saranno diventati marginali, senza una chiara strada di ritorno.\n\nMa chi integra l'AI in modo consapevole, strategico e profondo? Quelli avranno un vantaggio composto che si accumula anno dopo anno. **La scelta è oggi**, il momento è adesso, e l'opportunità è reale.\nLa vera trasformazione non è sul cosa facciamo, ma sul come lo facciamo.\n\n**L'intelligenza artificiale nel 2026 non ha rimpiazzato gli sviluppatori**; ha amplificato le loro capacità. Però, questo è cruciale, ha anche accelerato la curva di obsolescenza per le **competenze "meccaniche"** e creato un nuovo livello di **entry barrier per il valore strategico**.\n\n## Le ultime tre riflessioni chiave:\n\n1. **Il valore si sposta verso il pensiero critico**: Chi sa cosa chiedere all'AI, come validare le risposte e costruire architetture che l'AI augmenta—questi sono gli sviluppatori che comanderanno il mercato nel 2027-2030.\n2. **La specializzazione è diventata obbligatoria**: L'AI ha reso il "full-stack generico" sempre meno competitivo. Gli sviluppatori che prosperano sono quelli che costruiscono expertise profonda in uno o più domini (Systems, Security, ML, DevOps, etc.).\n3. **La brecha di competenza si allargherà ulteriormente**: Coloro che abbracciano l'AI e evolvono rapidamente avranno accesso a opportunità e salari sempre più elevati. Chi resiste o ignora la trasformazione rischia marginalizzazione professionale.\n\n##Per i prossimi 12-24 mesi, l'azione è chiara:\n- **Sperimenta attivamente** con ChatGPT, Copilot, Claude e Gemini. Non fare la scuola vecchia, non imparare "teoricamente"—usa questi tool nel tuo flusso quotidiano.\n- **Sviluppa prompt engineering** skills come se fosse una lingua nuova. Perché in realtà lo è.\n- **Identifica la tua specializzazione** (Backend systems? Security? ML? DevOps?). L'IA amplifica gli esperti; genericità non scala più.\n- **Investi in problem-solving e architectural thinking**. Queste capacità non sono automizzabili—almeno non nel prossimo decennio.\n- **Se sei un manager/CTO**: La tua job non è "come sostituisco i developer con l'AI", ma "come reskillo il mio team per operare 10x più velocemente e su problemi 10x più complessi".\n\n## Conclusioni finali\n\n**L'AI nel 2026** non è un'innovazione astratta o futura.** È il presente**. E il futuro appartiene a coloro che la guardano non come una minaccia, ma come uno strumento di amplificazione personale e organizzativa.\n\nColoro che ignorano questa trasformazione non stanno rimanendo **"come erano"**; stanno diventando progressivamente meno competitivi in un mercato che si muove rapidamente. Questo non è una critica, è una descrizione della realtà del mercato.\n\n## Epilogo: Una Riflessione\n\nNel febbraio 2016, AlphaGo ha battuto Lee Sedol (il campione mondiale di Go). La gente ha chiesto: **"Se l'AI batte l'umano a Go, quanto tempo prima che batta l'umano nella programmazione?"**\nErano domande legittime allora. Oggi, nel 2026, abbiamo la risposta—e non è quella che molti temevano.\n\nL'AI non ha "battuto" gli sviluppatori. Ha fatto qualcosa di più interessante: li ha trasformati.\n\n### Il Paradosso della Competenza\n\nQuando AlphaGo ha vinto, i comentatori hanno interpretato il risultato come un'estensione della competizione umana: "L'AI è diventata più brava dell'umano nel gioco X." Era una proiezione diretta di superiorità.\n\nMa la programmazione non è Go. E il 2026 l'ha dimostrato chiaramente.\n\nSì, un LLM può generare codice più velocemente di un umano. Sì, può suggerire pattern, refactoring, fix per bug comuni. Ma un LLM—nemmeno il più sofisticato—può fare ciò che uno sviluppatore competente fa quotidianamente:\n- **Decidere** se un problema vale la pena essere risolto (vs. essere reframed)\n- **Comprendere** il contesto organizzativo e i vincoli politici/economici\n- **Fare trade-off etici** e di design che non hanno una risposta "corretta"\n- **Innovare**: creare soluzioni che non esistevano prima\n- **Responsabilità**: essere chiamati a rendere conto quando le cose falliscono\nQuesti ultimi punti—soprattutto l'ultimo—sono cruciali e spesso sottovalutati.\n\n### Chi è Responsabile Quando Fallisce?\n\nImmagina uno scenario: un junior developer usa GitHub Copilot per generare una funzione di cryptografia per una fintech app. La funzione passa i test locali. Viene deployata in produzione. Tre settimane dopo, una vulnerability viene scoperta nel codice generato. L'app ha gestito $50M in transazioni.\n\nChi è responsabile? Il developer? Copilot? L'azienda?\n\nNel 2026, le leggi e le regulatory framework stanno ancora cercando di rispondere a questa domanda. Ma una cosa è certa: non è il modello a finire in aula. È l'umano. È il manager che l'ha approvato. È l'architetto che non ha fatto review.\n\nQuesta asimmetria di responsabilità è uno dei motivi per cui—contrariamente alle paure del 2015—gli sviluppatori rimangono al centro del sistema. L'AI amplifica, ma non sostituisce, la necessità di giudizio umano.\n\n### La Curva di Apprendimento si Piega, Non Si Rompe\n\nNegli ultimi dieci anni, abbiamo visto questo modello ripetersi in ogni industria toccata dall'automazione:\n- **Paura iniziale**: "L'AI farà il mio lavoro"\n- **Adozione rapida**: Coloro che abbacciano lo strumento diventano più produttivi\n- **Restrategizzazione**: Il ruolo evolve, non scompare\n- **Nuovi skill gap**: Emergono nuove competenze critiche\n- **Nuove gerarchie**: Chi sa usare bene lo strumento guadagna significativamente più di chi non lo sa\n\nLa programmazione nel 2026 segue questo pattern esattamente. Non è diverso da quando i database SQL hanno automatizzato la gestione manuale dei file. O quando i framework web hanno automatizzato il socket programming. O quando i container hanno automatizzato il deployment manuale.\n\nOgni volta che uno strato di complessità è stato assorbito dall'automazione, si è creato uno strato nuovo sopra: più strategico, più complesso, più remunerativo.\n\n### Il Vero Vantaggio Competitivo: Velocità di Evoluzione\n\nSe dovessi riassumere il 2026 in una frase: **"L'AI ha compresso il tempo tra idea e implementazione.**"\n\nUn'azienda con tre senior developer + AI tooling può ora fare quello che cinque anni fa richiedeva quindici developer. Non perché i tre sono **"cinque volte più bravi"**, ma perché il tempo speso su tasks meccaniche è crollato dal 60% al 20%.\n\nQuesto cambia tutto il modello economico di un'azienda tech:\n- Piccoli team possono competere con grandi (se ben guidati)\n- Velocità di innovazione diventa il differenziatore (non la velocità di hiring)\n- La qualità del problem-solving diventa critica (perché il boilerplate non è più il collo di bottiglia)\n\nChi ha capito questo nel 2024-2025 ha già un vantaggio insurmontabile su chi sta ancora discutendo se l'AI sia "veramente utile" o meno.\n\n### L'Elemento Umano che Non Scala\n\nEcco cosa nessun prompt engineering, nessun fine-tuning, nessun modello di prossima generazione può replicare:\n- L'intuizione che viene dall'aver fallito 50 volte e aver imparato dalle fallite\n- La capacità di dire "no" quando una soluzione elegante è anche fragile e non ne vale la pena\n- Il coraggio di rifiutare una feature perché il design è fondamentalmente sbagliato\n- La pazienza di sit con stakeholder confusi e tradurre ambiguità in requisiti chiari\n- L'umiltà di ammettere quando non sai qualcosa e imparare pubblicamente\n\nQuesti elementi—esperienza, giudizio, coraggio, umiltà—non sono meccanizzabili. Sono anzi amplificati dall'AI, perché liberano lo sviluppatore dalle distrazioni e lo lasciano focalizzato su ciò che conta davvero.\n\n### Il Prossimo Decennio: Una Previsione Sobria\n\n**Le proiezioni stimate per il 2030**\n\nCosa sarà comune:\n- **Ogni azienda tech** avrà policy sull'uso di AI coding tools (alcune permissive, altre molto restrittive)\n- **Il "junior developer entry-level**" come lo conoscevamo nel 2015 sarà pressochè estinto. O evolve rapidamente ad AI-fluent, o rimane bloccato a task di basso valore\n- **Il salary premium** per developer con AI expertise toccherà il 50-60% (vs. +35% nel 2026)\n- **La maggior parte delle aziende** avrà un ruolo di **"AI Architect"** o **"AI Strategy Lead"**\n\nCosa sarà ancora scarno:\n- Veri thought leader che capiscono sia il technical che lo strategico\n- Architetti di sistema che sanno come progettare per l'era dell'automazione\n- Specialist in sicurezza/compliance che capiscono le AI risks\n- Mentor che possono guidare junior developer attraverso la transizione\n\nCosa sarà clamorosamente irrilevante:\n- La velocità di coding meccanica (lines per ora, bugs nel primo push, etc.\n- La conoscenza enciclopedica della documentazione di una libreria\n- La capacità di debuggare per 8 ore dritte senza aiuto esterno\n- L'abilità di ricordare la sintassi esatta di un comando CLI\n\nQuesta morte del **"performance su execution"** e la resurrezione del **"performance su thinking"** è il vero earthquake che l'AI ha causato nel 2026.\n\n### Un Messaggio Finale ai Nostri Lettori\n\nSe leggi questo articolo e senti paura—è legittimo. Il cambiamento è sempre spaventoso.\n**Ma ricorda**: paura + azione = crescita. Paura + paralisi = obsolescenza.\n\nGli sviluppatori che il 2030 guarderanno al 2026 e diranno "fortunatamente ho iniziato presto" sono quelli che leggono questo oggi e domani cominciano a sperimentare. Non sono i più intelligenti, né i più dotati. Sono semplicemente quelli che hanno detto sì a una cosa nuova quando era ancora scomoda.\n\nGo batte l'umano a Go. Ma Go non costruisce aziende. Go non risolve problemi reali. Go non cambia il mondo.\nSviluppatori augmentati da AI? Questi costruiscono il futuro.\nE il futuro inizia domani mattina, quando accendi Copilot, premi "tab", e cominci a collaborare con la macchina che hai davanti.\n\nBuona fortuna. Farai benissimo.\n\n	L'intelligenza artificiale non sostituisce gli sviluppatori, ma trasforma radicalmente il loro ruolo. Scopri come AI code generation, debugging assistito e automazione stanno ridefinendo le competenze richieste, il flusso di lavoro e le carriere nel software development del 2026.	19	324	47	published	t	DKP-VAULT-CERT-ADMIN-7YU8X1	140b1f92a535892f4ae672248d4e3b1ae429f48d05f89108ebfffdd72fd0cb8b	5	1	2026-10-23 13:14:29.874833	2026-10-23 13:14:29.874833	["Artificial Intelligence", "Ai Development", "Github Copilot", "Code Generation", "Future of Work", "Developer Skills", "Automation", "Machine Learning", "Career Development", "Productivity", "Tech Leadership", "Dev Tools", "ChatGPT", "Gemini", "Claude", "Tabnine", "Amazon CodeWhisperer", "LLM", "Prompt Engineering", "DevOps & Automation", "Cloud Computing", "Machine Learning Infrastructure", "Version Control"]
58	Zero Trust Architecture: Progettare Reti Sicure senza Perimetro (Principi & Implementazione)	zero-trust-architecture-progettare-reti-sicure-senza-perimetro-principi-implementazione	## Introduzione\n\nNel mondo digitale odierno, il tradizionale modello di sicurezza basato sul perimetro è ormai obsoleto. Firewall, DMZ e controlli di accesso basati su IP non bastano più a difendere infrastrutture complesse, ibride e distribuite.\n\nLa soluzione? **Zero Trust Architecture (ZTA)** – un framework che assume un principio semplice ma rivoluzionario: *“Nessuno è fidato per default, neanche all’interno della rete.”*\n\nSe stai gestendo servizi in cloud, microservizi o applicazioni serverless, ZTA non è un’opzione: è diventata una necessità operativa. In questo articolo esploreremo i 5 principi fondamentali di Zero Trust, le implementazioni pratiche con strumenti come **HashiCorp Vault** e come applicare ZTA nel tuo ambiente.\n\n## 1. I 5 Principi Fondamentali di Zero Trust\n\nZero Trust non è un singolo prodotto, ma un approccio architetturale basato su cinque pilastri:\n\n### 1.1 Never Trust, Always Verify\n\nNessun utente, dispositivo o servizio è considerato affidabile a priori. Anche chi si connette dalla rete interna deve autenticarsi e autorizzarsi continuamente.\nEsempio: Un dipendente che accede al database HR deve autenticarsi ogni volta, non solo al login iniziale.\n\n### 1.2 Least Privilege Access\n\nAccesso limitato al minimo necessario per svolgere la task specifica. Questo include restrizioni per ruolo, tempo e contesto.\n**Esempio**: Un frontend non deve mai accedere direttamente al database; deve passare attraverso un API con permessi ristretti.\n\n### 1.2 Least Privilege Access\n\nAccesso limitato al minimo necessario per svolgere la task specifica. Questo include restrizioni per ruolo, tempo e contesto.\n**Esempio**: Un frontend non deve mai accedere direttamente al database; deve passare attraverso un API con permessi ristretti.\n\n### 1.3 Microsegmentazione\n\nDividere la rete in zone isolate (microsegmenti) per limitare il movimento laterale degli attaccanti.\n**Esempio**: Un attacco a un servizio di fatturazione non compromette il database clienti.\n\n### 1.4 Data Encryption Everywhere\n\nCrittografare i dati **in transito**, **in riposo** e **in uso**.\n**Esempio**: Utilizzare TLS per tutte le comunicazioni interni tra microservizi, non solo per il traffico esterno.\n\n### 1.5 Automated Policy Enforcement\n\nApplicare politiche di sicurezza in tempo reale tramite strumenti automatizzati.\n**Esempio**: Bloccare automaticamente richieste API sospette tramite un Policy Engine.\n\n## 2. Implementazione Pratica: Strumenti Chiave\n\nPer trasformare questi principi in pratica, è fondamentale utilizzare strumenti progettati per ZTA. Ecco i più rilevanti nel 2026:\n\n### 2.1 HashiCorp Vault: La Cintura di Sicurezza per i Dati\n\nVault è il pilastro per gestire segreti (API key, credenziali, certificati) in un ambiente Zero Trust.\n\n**Funzionalità chiave**:\n- Rotazione automatica delle credenziali.\n- Accesso basato su identity (non su IP).\n- Crittografia dinamica dei dati in riposo.\n\n**Implementazione tipica**:\n\n```Bash\n# Esempio di accesso a Vault tramite token univoco per ogni microservizio\nvault login -method=approle role_id=ABC123 secret_id=XYZ789\n```\n\nOgni microservizio ottiene un token temporaneo con permessi limitati, riducendo il rischio di compromissione.\n\n### 2.2 SPIFFE/SPIRE: Identità Verificabili per i Microservizi\n\n**SPIFFE** (*Secure Production Identity Framework For Everyone*) e **SPIRE** (*SPIFFE Runtime Environment*) permettono di assegnare identità univoche a ogni servizio, dispositivo o utente.\n- **Vantaggio**: Gli attaccanti non possono impersonare un servizio senza accedere alla sua identity.\n- **Esempio**: Un servizio di pagamento in Kubernetes si autentica tramite un certificato SPIFFE, non tramite una password.\n\n### 2.3 Istio: Microsegmentazione e Controllo del Traffico\n\n**Istio**, il service mesh basato su `Envoy Proxy`, offre:\n- **Policy enforcement**: Controllo granulare su chi può accedere a quale servizio.\n- **MTLS automatico**: Crittografia di tutti i flussi tra microservizi.\n- **Monitoraggio avanzato**: Analisi del traffico per rilevare anomalie.\n\n**Configurazione esempio**:\n\n```Yaml\napiVersion: security.istio.io/v1beta1\nkind: PeerAuthentication\nmetadata:\n  name: default\nspec:\n  mtls:\n    mode: STRICT\n```\nQuesto configura **Istio** per richiedere `MTLS` per tutti i servizi nel namespace.\n\n## 3. Architettura di Riferimento: Zero Trust in Kubernetes\n\nEcco un esempio pratico di implementazione su Kubernetes:\n\n```Mermaid\ngraph TD\n    A[Utente] -->|Autenticazione| B[Identity Provider]\n    B -->|Token JWT| C[API Gateway]\n    C -->|Policy Enforcement| D[Microservizio A]\n    C -->|Policy Enforcement| E[Microservizio B]\n    D -->|Richiede segreti| F[HashiCorp Vault]\n    F -->|Credenziali temporanee| D\n    E -->|Richiede dati| G[Database Crittografato]\n    G -->|Accesso tramite SPIFFE| G\n```\n### Passaggi chiave:\n1. **Identity Provider**: Autenticazione iniziale tramite `OAuth2` o `OpenID Connect`.\n2. **Token JWT**: Emesso con claim specifici (es. `role=app-admin`).\n3. **Policy Engine**: Verifica i permessi prima di concedere accesso a risorse.\n4. **Vault**: Fornisce segreti dinamici (es. credenziali DB) senza memorizzarli in chiaro.\n5. **SPIFFE**: Assegna identità ai microservizi per kommunicazioni sicure tra servizi.\n\n## 4. Vantaggi e Sfide di Zero Trust\n\n### Vantaggi:\n- **Riduzione del rischio di violazioni**: Nessun "perimetro" da violare.\n- **Scalabilità**: Funziona in ambienti ibridi e multi-cloud.\n- **Compliance**: Migliore tracciabilità per GDPR, HIPAA e altri standard.\n- **Performance**: Riduzione della superficie di attacco, meno risorse dedicata alla difesa.\n\n### Sfide:\n- **Cultura organizzativa**: Richiede un cambio di mentalità (dagli*"utenti fidati"* agli*"utenti non fidati"*).\n- **Complessità iniziale**: Configurazione di strumenti come Vault e Istio richiede esperienza.\n- **Costi di migrazione**: Integrazione con infrastrutture legacy può richiedere tempo.\n\n## 5. Passi Pronti all’Uso per Iniziare\n\n### Step 1: Valuta la tua architettura attuale\n\nIdentifica i punti critici dove i dati sensibili vengono accessi (es. database, API interne).\n- **Domanda chiave**: “Chi può accedere a cosa, e perché?”\n\n### Step 2: Implementa l’Identity-Based Access\n\nConfigura un Identity Provider (es. `Keycloak`, `Okta`) per emettere **token JWT** con claim specifici.\n- **Esempio**: Un microservizio di fatturazione richiede il claim `role=fatturazione` per accedere al servizio di pagamento.\n\n### Step 3: Definisci Policy di Accesso Granulari\n\nUsa un Policy Engine (es. Open Policy Agent) per definire regole come:\n*“Solo i servizi con claim `role=database-admin` possono accedere al database `prod_db`.”*\nEsempio di regola **Rego**:\n\n```Rego\npackage ztaconfig\n\nallow[user] {\n    input.role == "database-admin"\n    input.resource == "prod_db"\n}\n```\n\n### Step 4: Crittografa Tutti i Flussi\n\nAbilita** MTLS** con Istio per tutti i servizi e usa **TLS** per le comunicazioni esterne.\n- Configura `PeerAuthentication` in **Istio** per richiedere **MTLS** in modalità `STRICT`.\n\n### Step 5: Integra HashiCorp Vault per i Segreti Dinamici\n\nConfigura Vault per fornire credenziali temporanee e crittografare dati in riposo.\n\nEsempio pratico:\n\n```Bash\n# Configura Vault per generare credenziali dinamiche per un database\nvault write secret/data/database/config \\\n  db_username="app_user" \\\n  db_password="dynamic_secret_123"\n```\nOgni microservizio richiede credenziali univoche tramite:\n\n```Bash\nvault read -format=json secret/data/database/config\n```\nOutput:\n\n```Json\n{\n  "data": {\n    "data": {\n      "db_username": "app_user",\n      "db_password": "dynamic_secret_456"\n    }\n  }\n}\n```\n**Vantaggio**: Le credenziali vengono generate al volo e revocate automaticamente, eliminando il rischio di credenziali statiche.\n\n### Step 6: Monitora e Aggiorna le Policy in Tempo Reale\n\nUtilizza strumenti come **OpenTelemetry** per tracciare accessi e anomalie.\n- Configura alert per richieste non autorizzate (es. `denied_access` da Istio).\n- Esempio di configurazione in Istio:\n```Yaml\napiVersion: security.istio.io/v1beta1\nkind: RequestAuthentication\nmetadata:\n  name: strict-mtls\nspec:\n  selector: {}\n  jwtRules:\n  - issuer: "https://keycloak.example.com"\n```\n\n## Conclusione\n\nZero Trust non è un progetto tecnico isolato, ma un processo continuo di evoluzione della sicurezza.\nInizia con un singolo microservizio, testa l’implementazione su un ambiente di staging, e scala gradualmente.\n\n**Ricorda**:\n- La sicurezza non è un **"perimetro"**, ma un **flusso continuo di verifica**.\n- Strumenti come Vault, SPIFFE e Istio non sono opzionali: sono il **fondamento** di una rete Zero Trust moderna.\n\nSe vuoi approfondire, ti consiglio di approfondire:\n- La documentazione ufficiale di [HashiCorp Vault](https://developer.hashicorp.com/vault)\n- Il corso gratuito di [SPIFFE on Cloud Native](https://spiffe.io/)\n- Il whitepaper di [Istio Security](https://istio.io/latest/docs/concepts/security/)\n\n---\n*Stai già implementando Zero Trust nel tuo ambiente? Condividi le tue sfide nei commenti!* 🔒\n	Stai costruendo un’infrastruttura cloud e temi i limiti del tradizionale modello basato sul perimetro? La Zero Trust Architecture (ZTA) non è solo un buzzword: è la risposta per reti moderne, scalabili e sicure. Scopri i 5 principi fondamentali, le implementazioni pratici con strumenti come HashiCorp Vault e come applicare ZTA nel tuo ambiente.	6	17	41	published	t	DKP-VAULT-CERT-ADMIN-XO6NKW	ac34c799e59278d7dc3272a0ce2da632aaaf8c8709886c41140063ac130ea73c	2	1	2026-10-25 07:13:15.718206	2026-10-25 07:13:15.718206	["HashiCorp Vault", "SPIFFE/SPIRE", "OpenZiti", "Istio", "Kubernetes", "Policy Engine", "Microsegmentazione", "Identity-Based Access", "Terraform", "Ansible", "Zero Trust Architecture", "Cybersecurity", "Network Security", "Identity Management", "Policy Enforcement", "Cloud Security", "Kubernetes Security"]
57	Progettare una pipeline CI/CD: test, build e deploy in passaggi affidabili	progettare-una-pipeline-ci-cd-test-build-e-deploy-in-passaggi-affidabili	## Introduzione\n\nUna **pipeline CI/CD** rappresenta l'automazione end-to-end del ciclo di vita del software: dall'integrazione del codice al deployment in produzione. Non è semplicemente uno strumento, ma una metodologia che riduce errori umani, accelera il rilascio e garantisce consistenza.\n\nIn questo articolo esploreremo come progettare una pipeline robusta, affidabile e scalabile, affrontando ogni stadio critico: testing, building e deployment.\n\n## 1. I pilastri di una pipeline CI/CD\n\n### Continuous Integration (CI)\n\nLa CI automatizza l'integrazione del codice in un repository condiviso, eseguendo test e controlli di qualità ad ogni commit. L'obiettivo è rilevare problemi il più presto possibile.\n\n### Continuous Delivery (CD)\n\nLa CD estende la CI automatizzando il rilascio di artefatti pronti per la produzione, mantenendo però un passaggio manuale finale.\n\n### Continuous Deployment\n\nUna versione più aggressiva della CD che elimina l'approvazione manuale, deployando automaticamente ogni build validata.\n\n## 2. Architettura della pipeline: gli stage fondamentali\n\nUna pipeline moderna segue questa struttura:\n\n| ==Stage== | ==Obiettivo== | ==Strumenti== | ==Tempo== |\n|---|---|---|---|\n| **Trigger & Checkout** | Avvia il workflow al push/merge | Git webhooks | < 1 min |\n| **Code Quality** | Analisi statica e metriche | SonarQube, ESLint, Checkstyle | 2-5 min |\n| **Unit Testing** | Test del singolo componente | JUnit, Pytest, Jest | 3-10 min |\n| **Build** | Compilazione e packaging | Maven, Gradle, NPM, Docker | 5-15 min |\n| **Integration Testing** | Test tra componenti | \tTestNG, Cucumber | 5-20 min |\n| **Security Scanning** | Analisi di vulnerabilità | OWASP Dependency Check, Snyk | 3-10 min |\n| **Artifact Storage** | Archiviazione build | Nexus, Artifactory, Docker Registry | 1-2 min |\n| **Staging Deploy** | Deploy in ambiente test | Kubernetes, Docker Compose | 2-5 min |\n| **E2E Testing** | Test end-to-end completi | Selenium, Cypress, Playwright | 10-30 min |\n| **Production Deploy** | Rilascio in produzione | ArgoCD, Spinnaker, Terraform | 5-10 min |\n| **Monitoring & Validation** | Verifica post-deploy | Prometheus, DataDog, Custom Scripts | Continuo |\n---\n## 3. Testing: la fondazione della qualità\n\n### Piramide dei test\n\nLa struttura ottimale prevede:\n- **Unit Tests (60%)**: test veloci e isolati di singoli metodi/funzioni\n- **Integration Tests (30%)**: verifica dell'integrazione tra componenti\n- **E2E Tests (10%)**: scenari utente completi\n\n### Best practices per i test in CI/CD\n\n```Yaml\n# Esempio: .gitlab-ci.yml\nstages:\n  - test\n  - build\n\nunit_tests:\n  stage: test\n  image: gradle:7.0\n  script:\n    - gradle test --scan\n  coverage: '/Code Coverage: (\\d+\\.\\d+)%/'\n  artifacts:\n    reports:\n      junit: build/test-results/**/*.xml\n  retry:\n    max: 2\n    when: runner_system_failure\n\nintegration_tests:\n  stage: test\n  image: docker:latest\n  services:\n    - docker:dind\n    - postgres:13\n  script:\n    - docker build -t myapp:test .\n    - docker run --network=postgres myapp:test ./gradlew integrationTest\n  dependencies:\n    - unit_tests\n```\n### Metriche critiche\n- **Code Coverage**: mantenere > 80% sugli elementi critici\n- **Test Execution Time**: target < 15 minuti per suite complete\n- **Flakiness Rate**: < 1% (test instabili richiedono refactoring)\n- **Failure Rate**: tracciare e risolvere test che falliscono frequentemente\n\n## 4. Build: reproducibility e versioning\n\n### Principi fondamentali\n1. **Determinism**: stessa sorgente = stesso output\n2. **Artifact Versioning**: ogni build deve essere rintracciabile\n3. **Dependency Management**: lock file o pinning delle versioni\n\n### Strategia di versionamento\n\nSemantic Versioning: `MAJOR.MINOR.PATCH`\n- `MAJOR`: breaking changes\n- `MINOR`: nuove feature compatibili\n- `PATCH`: bug fix\n\n```Groovy\n// build.gradle - Esempio con versionamento automatico\nversion = "${project.version}-${System.getenv('CI_PIPELINE_ID')}-${System.getenv('CI_COMMIT_SHORT_SHA')}"\n\ntask buildDocker {\n    doLast {\n        exec {\n            commandLine 'docker', 'build', '-t', "registry.example.com/myapp:${version}", '.'\n        }\n    }\n}\n```\n### Container images\n\nI container garantiscono reproducibility assoluta:\n\n```Dockerfile\n# Dockerfile ottimizzato per pipeline\nFROM gradle:7.0-jdk11 AS builder\nWORKDIR /build\nCOPY . .\nRUN gradle build -x test\n\nFROM openjdk:11-jre-slim\nCOPY --from=builder /build/build/libs/*.jar app.jar\nEXPOSE 8080\nENTRYPOINT ["java", "-jar", "app.jar"]\n```\n\n## 5. Deployment: safety e automation\n\n### Strategie di deployment\n\n| ==Strategia== | ==Rischio== | ==Rollback== | ==Scenario ideale== |\n|---|---|---|---|\n| **Blue-Green** | Basso | Istantaneo | Critical applications |\n| **Canary** | Molto Basso | Progressivo | Utenti a rischio minimo |\n| **Rolling** | Medio | Lento | Service con replica |\n| **Recreate** | Alto | Manuale | Dev/Test environments |\n\n### Esempio: Blue-Green con Kubernetes\n\n```Yaml\n# deployment-blue.yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: myapp-blue\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: myapp\n      version: blue\n  template:\n    metadata:\n      labels:\n        app: myapp\n        version: blue\n    spec:\n      containers:\n      - name: myapp\n        image: registry.example.com/myapp:v1.2.0\n        ports:\n        - containerPort: 8080\n        resources:\n          requests:\n            memory: "256Mi"\n            cpu: "250m"\n          limits:\n            memory: "512Mi"\n            cpu: "500m"\n        livenessProbe:\n          httpGet:\n            path: /health\n            port: 8080\n          initialDelaySeconds: 30\n          periodSeconds: 10\n```\n### Post-deployment validation\n\n```Bash\n#!/bin/bash\n# smoke-tests.sh\n\nENDPOINT="https://prod.example.com"\nTIMEOUT=300\n\necho "Waiting for service to be healthy..."\nfor i in $(seq 1 $TIMEOUT); do\n  if curl -f $ENDPOINT/health > /dev/null 2>&1; then\n    echo "✓ Service is healthy"\n    break\n  fi\n  sleep 1\n  if [ $i -eq $TIMEOUT ]; then\n    echo "✗ Service failed health check - rolling back"\n    exit 1\n  fi\ndone\n\n# Smoke tests\ncurl -f $ENDPOINT/api/status || exit 1\ncurl -f $ENDPOINT/api/users || exit 1\n\necho "✓ All smoke tests passed"\n```\n\n## 6. Monitoring e observability\n\nUna pipeline non termina al deploy: il monitoraggio è critico.\n\n### Metriche essenziali\n\n```Yaml\n# prometheus-rules.yaml\ngroups:\n  - name: deployment_metrics\n    rules:\n      - alert: HighErrorRate\n        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05\n        for: 2m\n        annotations:\n          summary: "High error rate detected"\n      \n      - alert: SlowResponse\n        expr: histogram_quantile(0.95, rate(request_duration_seconds_bucket[5m])) > 1\n        for: 5m\n        annotations:\n          summary: "P95 response time exceeded 1s"\n```\n\n### Dashboard essenziali\n- **Deployment Frequency**: quante volte deployiamo a settimana\n- **Lead Time**: dalla commit al deploy in produzione\n- **Mean Time to Recovery (MTTR)**: tempo per risolvere incidenti\n- **Change Failure Rate**: % di deploy che causano problemi\n\n## 7. Best practices e anti-pattern\n\n### ✓ Best practices\n1. **Infrastructure as Code**: pipeline e infra definite in codice versionato\n2. **Artifact immutability**: non modificare artefatti dopo il build\n3. **Secrets management**: usare vault, non hardcodare credenziali\n4. **Retry logic**: implementare retry con backoff esponenziale\n5. **Parallel execution**: parallelizzare stage indipendenti\n6. **Notifications**: alert immediati su failure in channel team\n7. **Audit trails**: log completi di chi ha fatto cosa e quando\n\n### ✗ Anti-pattern da evitare\n- **Pipeline troppo lunghe**: target < 30 minuti per fase di test\n- **Tight coupling**: stage dipendenti gli uni dagli altri\n- **Manual gates critiche**: rallentano il feedback\n- **Sparse testing**: coverage basso causa regressioni\n- **Shared environments**: dev/staging/prod devono essere isolate\n- **No rollback strategy**: deploy senza piano B è pericoloso\n\n## 8. Implementazione pratica: CI/CD stack moderno\n\nUn setup contemporaneo combina:\n\n```Schema\n┌─────────────────────────────────────────────┐\n│ GitHub/GitLab (Source Control)              │\n└──────────────┬──────────────────────────────┘\n               │ (webhook trigger)\n┌──────────────▼──────────────────────────────┐\n│ GitHub Actions / GitLab CI / Jenkins         │\n│ (Orchestration & Automation)                 │\n└──────────────┬──────────────────────────────┘\n               │\n     ┌─────────┼─────────┬──────────────┐\n     │         │         │              │\n┌────▼──┐  ┌───▼───┐ ┌──▼──┐      ┌───▼──┐\n│SonarQube│ │Docker │ │JUnit│      │OWASP │\n│(SAST)  │ │(Build)│ │Test │      │Scan  │\n└────┬──┘  └───┬───┘ └──┬──┘      └───┬──┘\n     │         │        │             │\n     └─────────┼────────┼─────────────┘\n               │\n        ┌──────▼──────────┐\n        │Docker Registry   │\n        │(Artifact Store)  │\n        └──────┬───────────┘\n               │\n        ┌──────▼──────────────────┐\n        │ArgoCD/Spinnaker Deploy   │\n        │(GitOps/CD Orchestration) │\n        └──────┬───────────────────┘\n               │\n    ┌──────────┼──────────────┐\n    │          │              │\n┌───▼──┐  ┌────▼────┐  ┌─────▼──┐\n│Staging│  │Production│  │Monitoring\n│Env    │  │  Env     │  │(Prometheus/\n│(k8s)  │  │  (k8s)   │  │ DataDog)\n└───────┘  └──────────┘  └────────┘\n```\n\n## Conclusione\n\nUna pipeline CI/CD ben progettata non è solo un'automazione tecnica: è **una leva di trasformazione organizzativa** che:\n- **Accelera il time-to-market**: feature in produzione in ore, non settimane\n- **Riduce rischi**: test automatizzati e deployment controllati\n- **Migliora la qualità**: feedback immediato su ogni cambiamento\n- **Aumenta la fiducia**: team più sicuri nei deploy\n\nIl viaggio verso la maturità **CI/CD** è incrementale: inizia con unit test e build automatici, poi aggiungi test di integrazione, scanning di sicurezza, deployment automatizzati. La chiave è iterare e misurare, osservando le metriche (deployment frequency, lead time, change failure rate) per guidare il miglioramento continuo.\n	Una pipeline CI/CD ben progettata è il fondamento della qualità e della velocità di delivery nel software moderno. Scopri come strutturare test automatizzati, build affidabili e deployment sicuri attraverso passaggi orchestrati e monitorati, riducendo rischi e accelerando il time-to-market.	1	41	41	published	t	DKP-VAULT-CERT-ADMIN-GLUW3O	6d571b144d092b4c2be8ca998f3900641d5fe4a03a2e17511397a0284d481299	1	1	2026-10-25 05:54:15.808723	2026-10-25 05:54:15.808723	["Jenkins", "GitLab CI/CD", "GitHub Actions", "Docker", "Kubernetes", "SonarQube", "Prometheus", "ArgoCD", "DevOps", "CI/CD", "Pipeline", "Infrastructure as Code", "Build Automation", "Monitoring", "Testing"]
56	Rust per chi sviluppa backend: ownership, errori e struttura di un progetto	rust-per-chi-sviluppa-backend-ownership-errori-e-struttura-di-un-progetto	## Introduzione \n\nDa anni, il panorama dello sviluppo backend è dominato da tre giganti: Java/Spring, Go e Node.js. Ogni linguaggio offre il suo compromesso: la potenza e la verbosità di Java, la semplicità e le performance moderate di Go, l’universalità e l’I/O non bloccante di Node.\n\nMa negli ultimi anni, un nuovo contendente ha iniziato a ridisegnare le fondamenta dell’architettura backend: **Rust**.\n\nPer molti sviluppatori backend, Rust è inizialmente intimidatorio. Il suo sistema di ownership e i controlli del compilatore possono sembrare ostacoli. Tuttavia, per chi costruisce sistemi distribuiti, microservizi ad alte prestazioni o infrastrutture critiche, Rust offre qualcosa di unico: **sicurezza della memoria e concorrenza senza garbage collector (GC), con performance pari al C++**.\n\nIn questo articolo, esploreremo perché Rust è una scelta solida per il backend, focalizzandoci su tre pilastri: il sistema di ownership, la gestione degli errori e la struttura standard di un progetto.\n\n### 1. Ownership: Non è solo un concetto, è la tua sicurezza\n\nIl motivo principale per cui Rust è considerato rivoluzionario è il suo sistema di ownership. Per uno sviluppatore backend abituato a linguaggi con **Garbage Collector (GC)** come Java o Python, il concetto può sembrare astratto. In realtà, è estremamente pratico.\n\n### Il problema del GC nei backend\n\nNei servizi ad alta concorrenza, il Garbage Collector può causare "stop-the-world" pause imprevedibili. In un backend che deve gestire migliaia di richieste al secondo, ogni millisecondo di latenza aggiunto dal GC è un problema di** SLA (Service Level Agreement)**.\n\n### Come Rust risolve il problema\n\nRust elimina la necessità del GC garantendo la sicurezza della memoria a compile-time, attraverso tre regole:\n1. Ogni valore in Rust ha un owner.\n2. Ci può essere un solo owner alla volta.\n3. Quando l’owner esce di scope, il valore viene distrutto.\n\nQuesto significa che i **dangling pointers e i buffer overflow sono impossibili** in Rust sicuro. Per un backend, questo si traduce in:\n- **Niente race conditions** in tempo di esecuzione (il compilatore le blocca).\n- **Memory leak impossibili** (il valore viene deallocato quando non è più usato).\n- **Performance prevedibili** (nessuna pausa del GC).\n\nEsempio pratico:\n\n```Rust\n// In Go o Java, gestiresti la memoria in modo implicito.\n// In Rust, il controllo è esplicito e sicuro.\n\nfn process_data(data: Vec<u8>) {\n    // `data` viene spostato nella funzione.\n    // Non può essere usato nel caller dopo questa chiamata.\n    // Questo previene accessi a memoria già liberata.\n    let result = analyze(data);\n    println!("Analisi completata: {:?}", result);\n}\n\n```\n\n## 2. Gestione degli errori: No exceptions, solo Result\n\nUno dei cambiamenti di mentalità più grandi per uno sviluppatore backend tradizionale è che **Rust non ha eccezioni (exceptions)**.\n\nIn **Java**, **Python** o **JavaScript**, gli errori sono gestiti con `try/catch`. Questo approccio può portare a:\n- Errori silenziosi non gestiti.\n- Stack trace complessi e difficili da debuggare.\n- Code che mescola logica di business e gestione degli errori.\n\n### Rust: Errori come valori\n\nIn Rust, gli errori sono valori. Vengono restituiti esplicitamente dalle funzioni, costringendo lo sviluppatore a gestirli.\n\nIl tipo `Result<T, E>` è la base:\n- ` Ok(T)`: Operazione riuscita.\n- `Err(E)`: Operazione fallita con un errore specifico.\n\nVantaggi per il backend:\n1. **Visibilità degli errori**: Se una funzione può fallire, il compilatore ti obbliga a gestire il caso `Err`. Non puoi ignorarlo.\n2. **Propagazione elegante**: L’operatore `?` permette di propagare errori in modo conciso, senza nidificazione infinita di `if/else`.\n3. **Errori specifici**: Puoi definire tipi di errore personalizzati che descrivono esattamente cosa è andato storto (es. `DatabaseError`, `AuthError`), facilitando il logging e il monitoring (cruciale per i backend).\n\nEsempio:\n\n```Rust\nuse std::fs::File;\nuse std::io::{self, Read};\n\nfn read_config() -> Result<String, io::Error> {\n    let mut file = File::open("config.json")?; // Propaga l'errore se il file non esiste\n    let mut contents = String::new();\n    file.read_to_string(&mut contents)?; // Propaga l'errore se la lettura fallisce\n    Ok(contents)\n}\n```\nNel contesto di un backend, questo significa che puoi trattare gli errori come parte del flusso di business, non come casi eccezionali.\n\n## 3. Struttura di un progetto Rust per il backend\n\nUn progetto Rust backend tipico segue una struttura modulare. Non c’è un framework monolitico che impone una struttura rigida (come **Spring Boot**), ma la comunità ha adottato pattern consolidati.\n\n### Struttura tipica:\n\n```Schema\nmy_backend/\n├── Cargo.toml          # Manifest del progetto (dipendenze e metadata)\n├── Cargo.lock          # Versioni esatte dei dipendenze\n├── src/\n│   ├── main.rs         # Punto di ingresso (avvia il server)\n│   ├── lib.rs          # Logica di business (se è una libreria)\n│   ├── models/         # Strutture dati e entità\n│   │   └── user.rs\n│   ├── services/       # Logica di business\n│   │   └── user_service.rs\n│   ├── repositories/   # Accesso ai dati\n│   │   └── user_repo.rs\n│   ├── handlers/       # Controller HTTP (axum/actix)\n│   │   └── user_handler.rs\n│   └── config.rs       # Configurazione (dotenv, env vars)\n└── tests/              # Test integration e unitari\n```\n### Componenti chiave:\n\nA. **Cargo**: Il package manager e build tool. Gestisce dipendenze, build, test e documentazione. È incredibilmente veloce.\nB. **Tokio**: Il runtime asincrono. La maggior parte dei backend Rust moderni si usa Tokio per gestire la concorrenza `I/O-bound`.\nC. **Axum o Actix-web**: I framework web più popolari.\n- **Axum**: Creato dal team di Tokio, è moderno, modulare e si integra perfettamente con l’ecosistema async.\n- **Actix-web**: Più maturo, estremamente veloce, ma con una curva di apprendimento leggermente più ripida.\nD. **Serde**: La libreria standard per serializzazione e deserializzazione (JSON, YAML, ecc.).\n\nEsempio di endpoint con Axum:\n\n```Rust\nuse axum::{Router, Json, routing::get};\nuse serde::{Deserialize, Serialize};\n\n#[derive(Serialize, Deserialize)]\nstruct User {\n    id: u64,\n    name: String,\n}\n\nasync fn get_user() -> Json<User> {\n    let user = User {\n        id: 1,\n        name: "Alice".to_string(),\n    };\n    Json(user)\n}\n\n#[tokio::main]\nasync fn main() {\n    let app = Router::new().route("/user", get(get_user));\n    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();\n    axum::serve(listener, app).await.unwrap();\n}\n```\n\n## 4. Perché scegliere Rust per il backend oggi?\n\n### Performance\n\n**Rust** offre performance vicine al `C/C++`. In benchmark come il *TechEmpower Web Framework Benchmark*, Rust (con Axum e Actix) si posiziona costantemente ai primi posti, superando `Go`, `Java` e `Node.js` in termini di richieste al secondo e utilizzo di memoria.\n\n### Sicurezza\n\nCome visto, il sistema di ownership e la gestione degli errori eliminano intere classi di vulnerabilità comuni nei backend:\n- Buffer overflows\n- Race conditions\n- Null pointer exceptions\n- Memory leaks\n\n### Ecosistema in crescita\n\nSebbene l’ecosistema sia più piccolo di quello di Java o Python, sta crescendo rapidamente. Librerie come `SQLx` (per SQL safe), `Diesel` (ORM), `Tower` (middleware) e `Tracing` (logging) rendono Rust pronto per la produzione.\n\n### Interoperabilità\n\nRust può essere compilato in Wasm (WebAssembly), permettendoti di eseguire codice backend nel browser o in edge computing (Cloudflare Workers, Deno) con le stesse performance e sicurezza.\n\n## Conclusione\n\n**Rust** non è solo un linguaggio di sistemi. Sta dimostrando di essere un’**eccellente scelta per il backend**.\n\nIl suo approccio all’ownership elimina i bug di memoria, la gestione degli errori rende il codice più robusto e prevedibile, e la struttura modulare permette di costruire servizi scalabili e mantenibili.\n\nSe sei uno sviluppatore backend che cerca di migliorare le performance, ridurre la latenza e aumentare la sicurezza, Rust vale la pena di essere esplorato. La curva di apprendimento è ripida, ma la ricompensa è un codice che non solo funziona, ma **non può sbagliare** (nella maggior parte dei casi).\n\n---\n\n*Hai già usato Rust per il backend? Qual è stata la tua esperienza con l’ownership o la gestione degli errori? Condividila nei commenti!* 🚀\n\n\n\n	Stai sviluppando backend e cerchi performance e sicurezza senza compromessi? Scopri come Rust rivoluziona il backend moderno: dall’ownership che elimina i bug di memoria alla gestione elegante degli errori, passando per la struttura standard di un progetto. Un viaggio tecnico per capire perché Rust sta diventando la scelta preferita per servizi ad alte prestazioni.	9	67	40	published	t	DKP-VAULT-CERT-ADMIN-9OQNRV	843cdd786b34a4cc41cf10c0527ab3a1d763938094e4ece30ea08031e0610332	2	1	2026-10-25 04:46:25.183223	2026-10-25 04:46:25.183223	["Rust", "Backend Development", "Web Development", "Systems Programming", "Performance", "Safety", "Ownership", "Error Handling", "Axum", "Tokio", "Software Architecture", "DevOps", "PostgreSQL", "Tokio Postgres", "Serde", "Actix-web"]
59	OWASP Top 10 2026: SQL Injection, XSS e CSRF - Come Identificare e Prevenire	owasp-top-10-2026-sql-injection-xss-e-csrf-come-identificare-e-prevenire	## Introduzione\n\nNel 2026 il riferimento ufficiale più recente del progetto **OWASP** resta la versione 2025 dell’OWASP Top 10, una lista di consapevolezza sulle principali criticità di sicurezza per le web application. Tra i rischi più rilevanti per **l’AppSec** ci sono ancora injection, cross-site scripting e cross-site request forgery: tre vulnerabilità diverse, ma spesso collegate tra loro da input non validati, output non encodato e gestione debole delle sessioni. \n\n## Perché SQL Injection, XSS e CSRF contano ancora\n\nQueste tre famiglie di attacco sono ancora centrali perché colpiscono il punto più fragile di molte applicazioni: il confine tra dati e codice. In pratica, succede quando l’applicazione tratta come istruzione qualcosa che arriva dall’utente, oppure quando consente a un browser di eseguire contenuti non fidati senza i controlli giusti. OWASP considera la prevenzione tramite validazione, sanitizzazione, output encoding, token anti-CSRF e controlli di sessione come la base minima per ridurre il rischio.\n\n\n## 1) SQL Injection\n\nLa **SQL Injection** avviene quando input non fidati vengono concatenati in una query senza separare chiaramente dati e istruzioni. L’attaccante può alterare la logica della query, leggere dati non autorizzati, modificare record o, nei casi peggiori, ottenere esecuzione di comandi sull’infrastruttura applicativa.\n\n### Come riconoscerla\n\nI segnali tipici sono:\n- query costruite con concatenazione di stringhe;\n- filtri fatti solo lato frontend;\n- errori SQL esposti in risposta;\n- parametri che cambiano drasticamente il comportamento della query.\n\nEsempio vulnerabile:\n\n```Php\n$sql = "SELECT * FROM users WHERE email = '$email' AND password = '$password'";\n```\n\n### Come prevenirla\n\nLa difesa corretta è usare query parametrizzate o prepared statement, mai concatenazione manuale. In più:\n- valida i tipi di input\n- limita gli errori restituiti al client\n- monitora query anomale\n- fai code review e `SAST` sulle aree di accesso ai dati.\n\nEsempio sicuro:\n\n```Python\ncursor.execute(\n    "SELECT id, role FROM users WHERE email = %s AND password_hash = %s",\n    (email, password_hash)\n)\n```\n\n### Errori comuni\n- usare solo blacklist;\n- affidarsi al WAF come unica difesa;\n- “sanitizzare” a mano le stringhe SQL;\n- fidarsi del fatto che l’input arrivi da un form interno.\n\n## 2) XSS\n\nIl **Cross-Site Scripting** si verifica quando contenuto non fidato viene inserito in una pagina e il browser lo interpreta come codice. **OWASP** lo tratta come parte della categoria Injection, e distingue bene il problema: il dato deve restare dato, non diventare script.\n\n### Tipi principali\n- **Stored XSS**: il payload viene salvato e servito ad altri utenti.\n- **Reflected XSS**: il payload rimbalza subito nella risposta.\n- **DOM XSS**: la vulnerabilità nasce nel JavaScript lato client.\n\n### Come riconoscerla\n\nCerca:\n- uso improprio di `innerHTML`, `document.write`, `outerHTML`\n- template che non fanno escaping automatico\n- input utente inserito direttamente nel DOM\n- output HTML generato manualmente\n\nEsempio vulnerabile:\n\n```Js\ndocument.getElementById("msg").innerHTML = location.hash;\n```\n\n### Come prevenirla\n\nLa regola base è l’output encoding contestuale:\n- HTML entity encoding per il body\n- attribute encoding per gli attributi\n- URL encoding per i parametri URL\n- JavaScript encoding solo nel contesto giusto\n- sanitizzazione HTML solo quando l’HTML è davvero necessario\n\nOWASP raccomanda anche di usare framework moderni con escaping automatico e, dove possibile, **Trusted Types** e **Content Security Policy** per ridurre i sink pericolosi.\n\nEsempio corretto:\n\n```Js\ndocument.getElementById("msg").textContent = userInput;\n```\n\n### Errori comuni\n- fidarsi del solo frontend framework\n- usare sanitizzazione generica per ogni contesto\n- pensare che un WAF basti\n- inserire HTML utente senza policy di rendering\n\n## 3) CSRF\n\nLa **CSRF** sfrutta il fatto che il browser invia automaticamente cookie e credenziali a un sito autenticato. Un sito malevolo può indurre il browser dell’utente a compiere un’azione non voluta su un’app fidata, come cambiare password o inviare un ordine.\n\n### Come riconoscerla\n\nCampanelli d’allarme:\n- operazioni sensibili senza token anti-CSRF\n- richieste state-changing via GET\n- assenza di controllo origin/referrer\n- sessioni basate solo su cookie senza protezioni aggiuntive\n\n### Come prevenirla\n\nOWASP suggerisce di:\n- usare la protezione CSRF nativa del framework\n- aggiungere token CSRF a tutte le richieste state-changing\n- validare i token lato server\n- usare il pattern synchronizer token per app stateful\n- usare double submit cookie per app stateless\n- non usare GET per cambiare stato\n- aggiungere SameSite dove appropriato\n- verificare Origin/Referer quando possibile\n\nEsempio concettuale:\n\n```Html\n<meta name="csrf-token" content="TOKEN_GENERATO_SERVER_SIDE">\n```\n\n```Js\nfetch("/account/email", {\n  method: "POST",\n  headers: {\n    "X-CSRF-Token": token\n  },\n  body: JSON.stringify({ email: newEmail })\n});\n```\n### Errore fondamentale da evitare\n\n**CSRF** e **XSS** si influenzano a vicenda: una XSS può aggirare molte difese CSRF. Per questo la prevenzione XSS è anche una difesa indiretta contro CSRF.\n\n### Come fare identificazione in pratica\n\nUn buon flusso AppSec dovrebbe includere:\n- **Threat modeling** nelle fasi iniziali\n- **SAST** per intercettare concatenazioni e sink pericolosi\n- **DAST** con test attivi sulle rotte esposte\n- **code review** sui punti di input/output\n- **security test** sui controlli di sessione e autorizzazione\n- **logging di eventi** sospetti, ma senza esporre dati sensibili\n\nPer **SQL Injection** cerca query dinamiche.\nPer **XSS cerca sink DOM** e output non encodato.\nPer **CSRF cerca endpoint** mutativi senza token o senza verifiche di origine.\n\n## Checklist rapida di prevenzione\n- Usa query parametrizzate ovunque\n- Escape/encode sempre in base al contesto\n- Non fidarti dell’input validato solo lato client\n- Proteggi tutte le azioni state-changing con token CSRF\n- Blocca GET per operazioni che modificano dati\n- Usa cookie con attributi sicuri\n- Riduci i privilegi di DB e applicazione\n- Aggiungi test di sicurezza nella pipeline CI/CD\n\n## Conclusione\n\n**SQL Injection, XSS e CSRF non sono problemi “storici”**: sono ancora tra i difetti più costosi da correggere quando emergono tardi. La buona notizia è che le contromisure sono note, mature e molto efficaci se applicate in modo sistematico. In **AppSec**, la differenza non la fa un singolo controllo, ma la disciplina con cui proteggi input, output, sessioni e workflow sensibili.\n\n\n\n\n	Una guida pratica e approfondita per riconoscere, testare e mitigare tre delle vulnerabilità più critiche nel mondo AppSec: SQL Injection, XSS e CSRF. Dalle cause tecniche ai controlli di prevenzione, con esempi concreti e strategie applicabili in ambienti moderni.	6	20	41	published	t	DKP-VAULT-CERT-ADMIN-TFCRYJ	bc70a0f344914a769c32b3ba09ea8a73aaaf8aba223dcd2e41d82192b6527d88	4	1	2026-10-25 08:05:32.548429	2026-10-25 08:05:32.548429	["OWASP", "SQL Injection", "XSS", "CSRF", "Application Security", "AppSec", "Web Security", "Secure Coding", "Vulnerability Management", "Secure Development Lifecycle", "CI/CD", "React", "PostgreSQL", "OWASP ZAP", "Burp Suite", "CSP", "WAF", "Node.js", "Express", "Java Spring Boot", "Python Django"]
\.


--
-- Data for Name: blog_subcategories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.blog_subcategories (id, category_id, name, slug, created_at, description) FROM stdin;
1	1	Software Architecture	software-architecture	2026-10-07 18:21:46.715615	\N
7	3	AI Agents & RAG	ai-agents-rag	2026-10-07 18:49:16.587399	\N
8	3	Fine-Tuning & Quantization	fine-tuning-quantization	2026-10-07 18:49:16.813302	\N
9	3	Prompt Engineering & SAST	prompt-engineering-sast	2026-10-07 18:49:17.037643	\N
10	4	Smart Contracts & Solidity	smart-contracts-solidity	2026-10-07 18:49:17.483258	\N
11	4	Zero-Knowledge Proofs	zero-knowledge-proofs	2026-10-07 18:49:17.710008	\N
12	4	DeFi & Asset Tokenization	defi-asset-tokenization	2026-10-07 18:49:17.927765	\N
13	4	Layer 2 & Scaling	layer-2-scaling	2026-10-07 18:49:18.151785	\N
14	5	Docker & Kubernetes	docker-kubernetes	2026-10-07 18:49:18.591888	\N
15	5	GCP & Cloud Infrastructure	gcp-cloud-infrastructure	2026-10-07 18:49:18.931875	\N
16	5	Infrastructure as Code (Terraform)	iac-terraform	2026-10-07 18:49:19.157292	\N
17	6	Zero Trust Architecture	zero-trust-architecture	2026-10-07 18:49:19.596631	\N
18	6	Vault & Key Management	vault-key-management	2026-10-07 18:49:19.819627	\N
19	6	Threat Intelligence & SSE	threat-intelligence-sse	2026-10-07 18:49:20.045244	\N
20	6	Application Security (AppSec)	application-security	2026-10-07 18:49:20.264368	\N
21	7	Core Releases & Patch	core-releases-patch	2026-10-07 18:49:20.705091	\N
22	7	Sentinel & Threat Stream	sentinel-threat-stream	2026-10-07 18:49:20.92687	\N
23	7	Pulse Nexus Protocol	pulse-nexus-protocol	2026-10-07 18:49:21.150054	\N
24	8	PostgreSQL & Neon DB	postgresql-neon-db	2026-10-07 18:49:21.587645	\N
25	8	Drizzle ORM & Migrations	drizzle-orm-migrations	2026-10-07 18:49:21.811691	\N
26	8	Redis & Caching Strategies	redis-caching-strategies	2026-10-07 18:49:22.032318	\N
27	8	ETL & Real-time Pipelines	etl-realtime-pipelines	2026-10-07 18:49:22.255465	\N
28	9	TypeScript & Node.js	typescript-nodejs	2026-10-07 18:49:22.690235	\N
29	9	Rust Engineering	rust-engineering	2026-10-07 18:49:22.912448	\N
30	9	Go Backend Systems	go-backend-systems	2026-10-07 18:49:23.138241	\N
31	9	Python for Systems	python-for-systems	2026-10-07 18:49:23.390213	\N
32	10	Linux Kernel Modules	linux-kernel-modules	2026-10-07 18:49:23.824441	\N
33	10	Memory Management & eBPF	memory-management-ebpf	2026-10-07 18:49:24.045166	\N
34	10	System Calls & Performance	system-calls-performance	2026-10-07 18:49:24.269601	\N
35	1	Microservices & Event-Driven	microservices-event-driven	2026-10-07 18:49:24.70653	\N
36	1	Domain-Driven Design (DDD)	domain-driven-design	2026-10-07 18:49:24.927772	\N
37	11	Nuxt 4 & Vue 3	nuxt-4-vue-3	2026-10-07 18:49:25.37378	\N
38	11	Server Side Rendering (SSR)	ssr-performance	2026-10-07 18:49:25.593834	\N
39	11	Tailwind CSS & UI Components	tailwind-ui-components	2026-10-07 18:49:25.816918	\N
40	1	Cloud Computing & Provider	cloud-computing-provider	2026-10-08 03:44:59.449857	Guide a servizi, configurazioni e architetture cloud su Google Cloud, Microsoft Azure, AWS e altri provider.
41	1	Build & CI/CD	build-cicd	2026-10-08 03:46:55.578839	Strategie per rendere più rapide e affidabili compilazioni, test e distribuzioni automatiche.
43	1	DevOps & Infrastructure as Code	devops-infrastructure-as-code	2026-10-08 03:48:13.071846	Automazione e gestione dell’infrastruttura tramite codice, configurazioni riproducibili e pratiche DevOps.
44	1	Container & Orchestrazione	container-orchestrazione	2026-10-08 03:48:48.161225	Creazione, distribuzione e gestione di applicazioni containerizzate e dei relativi ambienti.
45	1	Serverless & Event-Driven	serverless-event-driven	2026-10-08 03:49:20.539793	Architetture basate su funzioni gestite, eventi e servizi cloud, con attenzione a casi d’uso e limiti.
46	1	Performance & Ottimizzazione	performance-ottimizzazione	2026-10-08 03:49:53.578272	Tecniche per migliorare tempi di risposta, uso delle risorse, costi cloud e prestazioni delle applicazioni.
47	1	Osservabilità & Affidabilità	osservabilit-affidabilit	2026-10-08 03:50:20.639528	Strumenti e pratiche per monitorare sistemi, individuare problemi e progettare servizi resilienti.
48	1	Networking & Sicurezza Cloud	networking-sicurezza-cloud	2026-10-08 03:50:58.666719	Reti, accessi e misure di sicurezza per proteggere applicazioni, dati e infrastrutture cloud.
49	1	Database & Sistemi Distribuiti	database-sistemi-distribuiti	2026-10-08 03:51:34.166041	Scelte architetturali per database, comunicazione tra servizi, consistenza e gestione dei dati distribuiti.
50	4	Fondamenti di Blockchain	fondamenti-di-blockchain	2026-10-08 03:58:03.723238	Concetti essenziali per capire come funzionano blockchain, nodi, transazioni, consenso e registri distribuiti.
51	4	Ethereum & Reti EVM	ethereum-reti-evm	2026-10-08 03:58:32.527581	Sviluppo e strumenti per Ethereum e per le reti compatibili con la Ethereum Virtual Machine.
52	4	Solidity & Smart Contract	solidity-smart-contract	2026-10-08 04:00:53.509869	Scrittura, test e rilascio di smart contract, con attenzione a linguaggi, librerie e strumenti di sviluppo.
53	4	Sicurezza & Audit	sicurezza-audit	2026-10-08 04:01:22.62429	Tecniche per individuare vulnerabilità, testare contratti e ridurre i rischi prima e dopo il rilascio.
54	4	dApp & Web3 Frontend	dapp-web3-frontend	2026-10-08 04:01:47.8443	Costruzione di interfacce che interagiscono con blockchain, contratti e wallet.
55	4	Wallet & Identità Digitale	wallet-identit-digitale	2026-10-08 04:02:44.71895	Integrazione dei wallet e gestione di firme, account, autenticazione e identità decentralizzata.
57	4	Solana & Altre Blockchain	solana-altre-blockchain	2026-10-08 04:04:05.879288	Sviluppo su ecosistemi diversi da EVM, con linguaggi, framework e strumenti specifici.
58	4	DeFi & Protocolli	defi-protocolli	2026-10-08 04:04:41.208343	Architetture e componenti tecniche delle applicazioni di finanza decentralizzata, come exchange e lending.
59	4	NFT & Tokenizzazione	nft-tokenizzazione	2026-10-08 04:05:10.381852	Sviluppo di token e applicazioni per collezionabili digitali, asset tokenizzati e standard correlati.
60	4	DAO & Governance	dao-governance	2026-10-08 04:05:39.357743	Strumenti e modelli tecnici per organizzazioni decentralizzate, votazioni e gestione di tesorerie on-chain.
61	4	Tool, Testing & DevOps	tool-testing-devops	2026-10-08 04:06:03.334685	Ambienti di sviluppo, test, deploy, monitoraggio e automazione per progetti blockchain.
62	9	JavaScript & TypeScript	javascript-typescript	2026-10-08 04:14:32.802611	Guide, strumenti e best practice per creare interfacce web dinamiche e applicazioni full-stack con JavaScript e TypeScript.
2	1	Design Patterns	design-patterns	2026-10-07 18:21:46.715615	GoF e pattern architetturali
6	3	Local AI & Ollama	local-ai-ollama	2026-10-07 18:49:16.365776	Esecuzione modelli open-source in locale
63	9	Python & Framework	python-framework	2026-10-08 04:14:58.910947	Approfondimenti su Python per lo sviluppo backend, l’automazione, l’analisi dei dati e l’intelligenza artificiale, con guide ai principali framework.
64	9	Java & Spring	java-spring	2026-10-08 04:15:28.059419	Risorse per sviluppare applicazioni backend e aziendali con Java, Spring e gli strumenti dell’ecosistema JVM.
65	9	C# & .NET	c-net	2026-10-08 04:15:57.293883	Tutorial e aggiornamenti su C# e .NET per applicazioni web, desktop, cloud e videogiochi.
66	9	Go & Backend	go-backend	2026-10-08 04:16:29.286211	Contenuti su Go e lo sviluppo di servizi backend efficienti, API, applicazioni cloud e sistemi concorrenti.
67	9	Rust & Framework	rust-framework	2026-10-08 04:16:54.462285	Guide a Rust per software sicuro e ad alte prestazioni, dai sistemi alle applicazioni web e agli strumenti da riga di comando.
68	9	PHP & Framework	php-framework	2026-10-08 04:17:16.400319	Articoli su PHP moderno e framework per realizzare siti, applicazioni web e API, inclusi i progetti basati su CMS.
69	9	Ruby & Rails	ruby-rails	2026-10-08 04:17:40.023409	Guide a Ruby e Ruby on Rails per costruire applicazioni web e funzionalità di prodotto con strumenti orientati alla produttività.
71	9	Swift & Apple Development	swift-apple-development	2026-10-08 04:18:35.516598	Tutorial e novità sullo sviluppo di app e software per iPhone, iPad, Mac e gli altri dispositivi Apple.
72	9	C & C++	c-c	2026-10-08 04:21:59.35116	Approfondimenti sui linguaggi C e C++ per sistemi, software embedded, videogiochi e applicazioni ad alte prestazioni.
73	9	Altri Linguaggi & Framework	altri-linguaggi-framework	2026-10-08 04:22:25.675639	Uno spazio per linguaggi, framework e strumenti non trattati nelle altre categorie, dalle alternative emergenti ai paradigmi di programmazione.
78	3	RAG & Vector Databases	rag-vector-databases	2026-10-08 04:35:24.844398	Retrieval-Augmented Generation, chunking, semantic search, reranking, embeddings e database vettoriali come Qdrant, Weaviate, Milvus e pgvector.
79	3	Fine-Tuning & Model Adaptation	fine-tuning-model-adaptation	2026-10-08 04:35:54.07245	LoRA, QLoRA, PEFT, instruction tuning, dataset per il fine-tuning e scelta tra RAG e fine-tuning.
80	3	AI Application Development	ai-application-development	2026-10-08 04:36:19.804507	Integrazione di modelli nei progetti web e mobile, API, streaming delle risposte, gestione della cronologia e interfacce conversazionali.
81	3	MLOps & LLMOps	mlops-llmops	2026-10-08 04:36:46.268089	Deployment, versionamento dei modelli, observability, logging, caching, valutazione in produzione e gestione dei costi.
82	3	Model Evaluation & Benchmarks	model-evaluation-benchmarks	2026-10-08 04:37:14.387149	Metriche per LLM, test automatici, hallucination detection, factuality, valutazione degli agenti e benchmark personalizzati.
83	3	Multimodal AI	multimodal-ai	2026-10-08 04:37:40.151657	Vision-language models, speech-to-text, text-to-speech, image generation, analisi di documenti e applicazioni multimodali.
84	3	Machine Learning Fundamentals	machine-learning-fundamentals	2026-10-08 04:38:04.795633	Regressione, classificazione, clustering, feature engineering, scikit-learn e introduzione alle reti neurali.
85	3	Deep Learning	deep-learning	2026-10-08 04:38:34.902288	PyTorch, TensorFlow, CNN, RNN, transformer, training loop, GPU e ottimizzazione dei modelli.
86	3	Computer Vision	computer-vision	2026-10-08 04:39:11.587036	Object detection, image classification, OCR, segmentazione, face recognition e modelli vision-language.
87	3	AI Security & Safety	ai-security-safety	2026-10-08 04:43:58.073034	Prompt injection, jailbreak, data poisoning, model extraction, sicurezza degli agenti e protezione dei dati.
88	3	Responsible AI & Ethics	responsible-ai-ethics	2026-10-08 04:44:25.203161	Bias, trasparenza, explainability, copyright, sicurezza e impatto dei sistemi basati sull’intelligenza artificiale.
89	3	AI Tools & Developer Workflows	ai-tools-developer-workflows	2026-10-08 04:45:07.909338	AI coding assistant, IDE con funzionalità AI, automazione del workflow, code review e generazione automatica dei test.
90	3	AI Projects & Tutorials	ai-projects-tutorials	2026-10-08 04:45:34.655041	Progetti completi e riproducibili: chatbot RAG, agenti con tool, assistenti locali, API AI e sistemi di ricerca semantica.
99	5	GitOps & Continuous Delivery	gitops-continuous-delivery	2026-10-08 05:16:28.034356	Argo CD, Flux, declarative infrastructure, repository come source of truth, progressive delivery e gestione dei manifest Kubernetes.
100	5	Observability & Monitoring	observability-monitoring	2026-10-08 05:17:12.979892	OpenTelemetry, Prometheus, Grafana, Loki, Jaeger, metriche, log, tracing distribuito, alerting e SLO.
101	5	Cloud Native Security	cloud-native-security	2026-10-08 05:17:37.192669	Container security, image scanning, secrets management, RBAC, policy-as-code, supply-chain security, SBOM e runtime protection.
102	5	Platform Engineering	platform-engineering	2026-10-08 05:18:05.762571	Internal Developer Platform, developer portal, Backstage, self-service infrastructure, golden paths e miglioramento della developer experience.
70	9	Kotlin & Android	kotlin-android	2026-10-08 04:18:03.091576	Sviluppo nativo Google
95	5	Serverless & Edge	serverless-edge	2026-10-08 04:55:05.383969	Funzioni e computazione edge
103	5	Microservices & Distributed Systems	microservices-distributed-systems	2026-10-08 05:18:34.535935	Service discovery, API gateway, comunicazione asincrona, gRPC, event-driven architecture, resilienza e gestione dei sistemi distribuiti.
104	5	Service Mesh & Cloud Networking	service-mesh-cloud-networking	2026-10-08 05:19:06.617175	Istio, Linkerd, Cilium, Envoy, mTLS, traffic management, ingress controller, networking Kubernetes ed eBPF.
105	5	Cloud Databases & Storage	cloud-databases-storage	2026-10-08 05:19:32.554473	Database gestiti, cloud-native storage, backup, replica, caching, persistent volumes, object storage e strategie di alta disponibilità.
106	5	Reliability Engineering & SRE	reliability-engineering-sre	2026-10-08 05:20:01.466989	SLA, SLI, SLO, error budget, incident response, capacity planning, disaster recovery e chaos engineering.
107	5	FinOps & Cloud Cost Optimization	finops-cloud-cost-optimization	2026-10-08 05:20:23.543369	Cost monitoring, rightsizing, autoscaling, risorse inutilizzate, cost allocation e ottimizzazione delle architetture cloud.
108	5	Cloud Providers & Multi-Cloud	cloud-providers-multi-cloud	2026-10-08 05:20:45.460367	AWS, Azure, Google Cloud, servizi gestiti, hybrid cloud, portabilità, networking tra cloud e strategie di migrazione.
109	5	Developer Experience & Automation	developer-experience-automation	2026-10-08 05:21:12.176881	CLI interne, template di progetto, ambienti di sviluppo replicabili, Dev Containers, automazione operativa e workflow per team.
110	5	WebAssembly & Lightweight Runtimes	webassembly-lightweight-runtimes	2026-10-08 05:21:39.409592	WebAssembly sul server, wasmCloud, edge functions, sandboxing e alternative leggere ai container tradizionali.
111	7	Release Notes	release-notes	2026-10-08 05:30:13.961842	\N
112	7	DKP Tools	dkp-tools	2026-10-08 05:30:32.26308	\N
113	7	Community Spotlight	community-spotlight	2026-10-08 05:30:58.059904	\N
114	7	News & Aggiornamenti	news-aggiornamenti	2026-10-08 05:31:45.952491	\N
115	6	Ethical Hacking	ethical-hacking	2026-10-08 06:03:13.543038	Reconnaissance, vulnerability scanning, penetration testing, privilege escalation, threat modeling e metodologia degli attacchi.
116	6	Vault & Encryption	vault-encryption	2026-10-08 06:03:43.950781	HashiCorp Vault, secret management, encryption at rest e in transit, key rotation, PKI, certificati e gestione delle chiavi.
117	6	API Security	api-security	2026-10-08 06:04:09.369076	OAuth 2.0, OpenID Connect, JWT, API gateway, rate limiting, autenticazione, autorizzazione e vulnerabilità OWASP API Security.
121	6	DevSecOps & Supply Chain Security	devsecops-supply-chain-security	2026-10-08 06:06:05.226649	Security scanning nelle pipeline, SAST, DAST, SCA, SBOM, firma degli artifact, dipendenze vulnerabili e software supply chain.
122	6	Identity & Access Management	identity-access-management	2026-10-08 06:06:30.493513	IAM, RBAC, ABAC, MFA, passwordless authentication, SSO, gestione delle identità machine-to-machine e workload identity.
123	6	Threat Intelligence & Threat Modeling	threat-intelligence-threat-modeling	2026-10-08 06:07:03.844542	STRIDE, attack trees, MITRE ATT&CK, indicatori di compromissione, analisi delle minacce e security-by-design.
124	6	Incident Response & Digital Forensics	incident-response-digital-forensics	2026-10-08 06:07:27.153568	Rilevamento degli incidenti, log analysis, triage, contenimento, malware analysis, post-mortem e disaster recovery.
126	6	Mobile & IoT Security	mobile-iot-security	2026-10-08 06:08:18.103351	Android, iOS, firmware, secure storage, device identity, applicazioni mobile e dispositivi connessi.
127	6	Privacy Engineering & Data Protection	privacy-engineering-data-protection	2026-10-08 06:08:41.296977	Data minimization, pseudonimizzazione, anonimizzazione, DLP, gestione dei dati sensibili e privacy-by-design.
128	6	AI Security	ai-security	2026-10-08 06:09:05.419792	Prompt injection, data poisoning, model theft, sicurezza degli AI agent, gestione dei tool e protezione delle pipeline RAG.
129	6	Security Tools & Labs	security-tools-labs	2026-10-08 06:09:47.936756	Burp Suite, Nmap, Wireshark, Metasploit, OWASP ZAP, Kali Linux, laboratori locali e ambienti CTF.
132	8	ORM & Drizzle	orm-drizzle	2026-10-08 06:58:24.475743	Drizzle ORM, Drizzle Kit, schema TypeScript, query builder, migrazioni, relazioni, transazioni e confronto con Prisma, Kysely e TypeORM.
133	8	MongoDB & Atlas	mongodb-atlas	2026-10-08 06:59:18.179806	Document modeling, embedding e referencing, aggregations, indexing, replica set, change streams e MongoDB Atlas.
134	8	SQL & Database Fundamentals	sql-database-fundamentals	2026-10-08 06:59:51.673406	Query SQL, JOIN, CTE, window functions, normalizzazione, denormalizzazione, transazioni e isolamento.
135	8	Database Design & Data Modeling	database-design-data-modeling	2026-10-08 07:00:16.94461	Progettazione dello schema, chiavi, relazioni, vincoli, multi-tenancy, audit trail e strategie di migrazione.
136	8	Database Performance & Optimization	database-performance-optimization	2026-10-08 07:00:38.673771	Query plan, EXPLAIN ANALYZE, indexing, connection pooling, N+1 query, partizionamento e ottimizzazione delle query.
137	8	Data Pipelines & ETL	data-pipelines-etl	2026-10-08 07:00:59.035202	Extract, transform, load, data ingestion, batch processing, data validation e pipeline riproducibili.
138	8	Streaming & Event-Driven Data	streaming-event-driven-data	2026-10-08 07:01:40.134283	Kafka, Redpanda, NATS, Redis Streams, eventi, consumer group, retry, dead-letter queue e processing in tempo reale.
139	8	Data Warehousing & Analytics	data-warehousing-analytics	2026-10-08 07:02:05.931097	BigQuery, Snowflake, ClickHouse, data warehouse, data lake, OLTP, OLAP e trasformazioni analitiche.
140	8	Search & Vector Databases	search-vector-databases	2026-10-08 07:02:31.247781	Elasticsearch, OpenSearch, pgvector, Qdrant, full-text search, semantic search e hybrid search.
141	8	Database Reliability & Operations	database-reliability-operations	2026-10-08 07:02:55.384847	Backup, replica, failover, disaster recovery, alta disponibilità, monitoring e gestione delle migrazioni in produzione.
193	5	AWS Architecture	aws-architecture	2026-10-11 07:54:08.528219	Amazon Web Services
194	5	Azure Solutions	azure-solutions	2026-10-11 07:54:08.750614	Microsoft Azure
195	5	Service Mesh	service-mesh	2026-10-11 07:54:09.424737	Istio, Linkerd, Consul
196	5	Observability	observability	2026-10-11 07:54:09.647635	Monitoraggio, Logging, Tracing
197	5	Site Reliability (SRE)	sre	2026-10-11 07:54:09.869954	Affidabilità dei sistemi
120	6	Cloud Security	cloud-security	2026-10-08 06:05:42.320629	Protezione ambienti Cloud
192	5	Kubernetes (K8s)	kubernetes	2026-10-11 07:54:07.84807	Orchestrazione container
179	5	CI/CD Pipelines	cicd-pipelines	2026-10-11 07:50:16.514699	Automazione del deployment
142	10	Rust & Systems	rust-systems	2026-10-08 08:22:05.916636	Ownership, borrowing, lifetimes, unsafe, no_std, FFI, async runtime, CLI native, WebAssembly ed embedded Rust.
144	10	Memory & Performance	memory-performance	2026-10-08 08:23:26.038682	Stack e heap, allocator, cache locality, data layout, memory leaks, false sharing, branch prediction, SIMD e gestione della concorrenza.
145	10	Benchmarks	benchmarks	2026-10-08 08:24:22.944216	Benchmark affidabili, Criterion, Google Benchmark, profiling, flame graph, latenza p50/p95/p99, throughput e analisi della regressione.
146	10	C, C++ & Interoperability	c-c-interoperability	2026-10-08 08:24:49.826049	Pointer, RAII, template, ABI, linking, FFI tra Rust e C/C++, migrazione di librerie legacy e gestione della memoria manuale.
147	10	Concurrency & Parallelism	concurrency-parallelism	2026-10-08 08:25:14.129481	Thread, mutex, atomic operations, lock-free programming, memory ordering, race condition, actor model e structured concurrency.
148	10	Operating Systems Internals	operating-systems-internals	2026-10-08 08:25:50.820943	Processi, thread, virtual memory, file descriptor, signals, scheduling, syscall, IPC e namespace Linux.
149	10	Networking & Protocols	networking-protocols	2026-10-08 08:26:13.6388	TCP/IP, UDP, sockets, HTTP internals, TLS, packet processing, io_uring, DPDK e networking ad alte prestazioni.
150	10	Debugging & Observability	debugging-observability	2026-10-08 08:26:33.412802	GDB, LLDB, strace, perf, bpftrace, core dump, sanitizers, Valgrind, crash analysis e debugging in produzione.
151	10	Compilers & Toolchains	compilers-toolchains	2026-10-08 08:26:55.769173	LLVM, GCC, linker, assembler, ABI, cross-compilation, build system, cargo, CMake, Make e gestione delle dipendenze native.
152	10	Embedded & Bare Metal	embedded-bare-metal	2026-10-08 08:27:19.408502	Microcontroller, firmware, RTOS, ARM, RISC-V, interrupt, DMA, gestione energetica e sviluppo senza sistema operativo.
153	10	Storage & Filesystems	storage-filesystems	2026-10-08 08:27:42.059075	Block storage, filesystem Linux, page cache, journaling, NVMe, database storage engine e direct I/O.
155	11	Frontend Architecture	frontend-architecture	2026-10-08 08:47:49.916342	Component design, feature-based architecture, state management, design patterns, monorepo, modularità e scalabilità del codice.
156	11	Tailwind & UI/UX	tailwind-uiux	2026-10-08 08:48:13.066712	Tailwind CSS, responsive design, design tokens, componenti riutilizzabili, accessibilità, tipografia, colori e design system.
157	11	Modern JavaScript & TypeScript	modern-javascript-typescript	2026-10-08 08:48:37.049236	TypeScript, JavaScript moderno, generics, utility types, configurazione dei progetti e best practice per applicazioni frontend.
158	11	Rendering & Web Performance	rendering-web-performance	2026-10-08 08:49:03.268559	SSR, SSG, CSR, ISR, hydration, lazy loading, code splitting, caching, Core Web Vitals e ottimizzazione del bundle.
159	11	State Management & Data Fetching	state-management-data-fetching	2026-10-08 08:49:39.24331	Pinia, composables e components, server state, caching lato client, optimistic updates, gestione dei form e sincronizzazione dei dati.
160	11	Component Design & Design Systems	component-design-design-systems	2026-10-08 08:50:55.963448	Approfondimenti su componenti headless, librerie UI, Storybook, le API dei componenti, le varianti, il design tokens e governance visiva.
161	11	Nuxt Web Accessibility	nuxt-web-accessibility	2026-10-08 08:51:32.063749	WCAG, navigazione da tastiera, ARIA, contrasto, screen reader, focus management e test di accessibilità.
162	11	Testing & Quality	testing-quality	2026-10-08 08:51:58.918382	Vitest, Vue Test Utils, Playwright, Cypress, unit test, integration test, end-to-end test e visual regression testing.
163	11	Nuxt Web Security	nuxt-web-security	2026-10-08 08:52:32.825208	XSS, CSRF, Content Security Policy, gestione dei cookie, autenticazione frontend, security headers e protezione delle applicazioni Nuxt.
164	11	Modern Web APIs & Browser	modern-web-apis-browser	2026-10-08 08:52:53.399755	Fetch API, WebSockets, Web Workers, Service Workers, Web Storage, Web Components e Progressive Web Apps.
165	11	Full-Stack JavaScript & BFF	full-stack-javascript-bff	2026-10-08 08:53:15.092874	API routes, server handlers, backend-for-frontend, validazione, autenticazione e integrazione con database e servizi esterni.
176	13	React & Next.js	react-next	2026-10-08 14:54:35.378746	Ecosistema React e meta-frameworks
5	3	LLM Architecture	llm-architecture	2026-10-07 18:49:16.13437	Architetture dei Large Language Models
178	5	Docker & K8s	docker-k8s	2026-10-11 07:50:16.295389	Containerizzazione e orchestrazione
173	4	DeFi Protocols	defi	2026-10-08 14:54:34.480963	Finanza decentralizzata e DEX
174	4	Zero-Knowledge Proofs	zkp	2026-10-08 14:54:34.705878	Privacy e scalabilità crittografica
175	13	Nuxt & Vue Ecosystem	nuxt-vue	2026-10-08 14:54:35.154958	Sviluppo con Vue 3 e Nuxt
171	6	Vault & Hashing	vault-hashing	2026-10-08 14:54:33.566368	Gestione segreti e crittografia
77	3	Prompt Engineering	prompt-engineering	2026-10-08 04:34:53.916881	Tecniche avanzate di prompting
166	3	AI Agents	ai-agents	2026-10-08 14:54:31.519546	Agenti autonomi e workflow AI
180	3	NLP & Computer Vision	nlp-vision	2026-10-11 07:54:04.914396	Elaborazione linguaggio e immagini
177	13	Styling & Tailwind	styling	2026-10-08 14:54:35.604587	CSS utility-first e design system
181	3	RAG & Vector DBs	rag-vector-dbs	2026-10-11 07:54:05.139674	Retrieval-Augmented Generation
182	3	MLOps	mlops	2026-10-11 07:54:05.365525	Deploy e gestione modelli in produzione
184	3	Generative Art & Audio	gen-art-audio	2026-10-11 07:54:05.815271	Generazione media tramite AI
119	6	Web Application Security	web-security	2026-10-08 06:05:18.975534	OWASP e protezione frontend/backend
185	3	Data Science & Analysis	data-science	2026-10-11 07:54:06.040049	Analisi esplorativa e statistica
186	3	Reinforcement Learning	reinforcement-learning	2026-10-11 07:54:06.262712	Apprendimento per rinforzo
187	3	AI Ethics & Safety	ai-ethics	2026-10-11 07:54:06.49201	Sicurezza e bias nell'IA
188	3	Edge AI	edge-ai	2026-10-11 07:54:06.715668	AI su dispositivi embedded e mobile
189	3	Transformers Deep Dive	transformers	2026-10-11 07:54:06.941348	Il cuore dell'AI moderna
190	3	AI Development Tools	ai-tools	2026-10-11 07:54:07.163267	Strumenti per sviluppatori AI
191	5	Docker & Containers	docker-containers	2026-10-11 07:54:07.626868	Containerizzazione applicazioni
167	5	GCP Architecture	gcp-architecture	2026-10-08 14:54:32.434385	Google Cloud Platform
168	5	Infrastructure as Code	iac	2026-10-08 14:54:32.659375	Terraform, Ansible, Pulumi
169	6	Zero Trust Architecture	zero-trust	2026-10-08 14:54:33.119089	Sicurezza senza perimetro
170	6	Penetration Testing	pentesting	2026-10-08 14:54:33.346232	Analisi e test vulnerabilità
202	6	Vault & Secrets	vault-secrets	2026-10-11 07:54:11.737073	Gestione sicura chiavi e token
203	6	Cryptography	cryptography	2026-10-11 07:54:12.419837	Cifratura, firme e algoritmi
204	6	Identity & Access (IAM)	iam	2026-10-11 07:54:12.644787	Autenticazione e Autorizzazione
205	6	Incident Response	incident-response	2026-10-11 07:54:12.868938	Gestione attacchi in corso
206	6	Malware Analysis	malware-analysis	2026-10-11 07:54:13.102453	Reverse engineering malware
207	6	DevSecOps	devsecops	2026-10-11 07:54:13.325531	Sicurezza integrata nella CI/CD
208	6	Social Engineering	social-engineering	2026-10-11 07:54:13.777099	Phishing e fattore umano
209	6	Digital Forensics	forensics	2026-10-11 07:54:14.00459	Indagini post-breach
210	6	Threat Intelligence	threat-intelligence	2026-10-11 07:54:14.225897	Analisi delle minacce globali
211	6	Compliance & Audit	compliance	2026-10-11 07:54:14.454823	GDPR, SOC2, ISO27001
212	4	Ethereum Ecosystem	ethereum	2026-10-11 07:54:15.579013	EVM, Layer 2 e Rollups
213	4	Solana Ecosystem	solana	2026-10-11 07:54:15.810945	Sviluppo su network Solana
214	4	Web3 Frontend	web3-frontend	2026-10-11 07:54:16.03356	Integrazione dApp (Wagmi, Ethers)
215	4	NFTs & Digital Assets	nfts	2026-10-11 07:54:16.260781	Standard token e mercati
216	4	DAOs & Governance	daos	2026-10-11 07:54:16.483842	Organizzazioni autonome
218	4	Consensus Mechanisms	consensus	2026-10-11 07:54:16.942106	PoW, PoS e tolleranza bizantina
219	4	Oracles & Data	oracles	2026-10-11 07:54:17.163258	Chainlink e dati off-chain
220	4	Decentralized Storage	decentralized-storage	2026-10-11 07:54:17.38667	IPFS, Filecoin, Arweave
221	4	Tokenomics	tokenomics	2026-10-11 07:54:17.611558	Economia dei token
222	4	Enterprise Blockchain	enterprise-blockchain	2026-10-11 07:54:17.834541	Hyperledger e reti private
223	4	Cryptography in Web3	web3-crypto	2026-10-11 07:54:18.063621	Crittografia applicata
224	13	Styling & CSS	styling-css	2026-10-11 07:54:18.967667	Tailwind, Sass, CSS-in-JS
225	13	State Management	state-management	2026-10-11 07:54:19.196718	Pinia, Redux, Zustand
226	13	Web Performance	web-performance	2026-10-11 07:54:19.418495	Core Web Vitals e ottimizzazioni
227	13	Accessibility (a11y)	accessibility	2026-10-11 07:54:19.647115	Sviluppo inclusivo e ARIA
228	13	Build Tools	build-tools	2026-10-11 07:54:19.868208	Vite, Webpack, Rollup
229	13	Frontend Testing	frontend-testing	2026-10-11 07:54:20.098297	Vitest, Cypress, Playwright
230	13	Micro-Frontends	micro-frontends	2026-10-11 07:54:20.318794	Architetture UI distribuite
231	13	PWA & Offline	pwa	2026-10-11 07:54:20.541698	Progressive Web Apps
232	13	WebGL & 3D	webgl-3d	2026-10-11 07:54:20.769741	Three.js e grafica nel browser
233	13	WebAssembly (Wasm)	wasm	2026-10-11 07:54:20.992645	Performance native sul web
234	13	UI/UX Engineering	ui-ux	2026-10-11 07:54:21.218741	Design systems e user experience
235	13	Animations	animations	2026-10-11 07:54:21.440133	GSAP, Framer Motion, CSS Anim
236	13	SEO & Meta	seo	2026-10-11 07:54:21.668396	Ottimizzazione motori di ricerca
237	14	Node.js, Bun & Deno	node-bun-deno	2026-10-11 07:54:22.121899	Runtime JavaScript lato server
238	14	Python Backend	python-backend	2026-10-11 07:54:22.345271	FastAPI, Django, Flask
239	14	Go & Rust	go-rust	2026-10-11 07:54:22.573179	Sistemi ad alte prestazioni
240	14	Java & .NET	java-dotnet	2026-10-11 07:54:22.81109	Sviluppo Enterprise
241	14	API Design	api-design	2026-10-11 07:54:23.039467	REST, GraphQL e best practices
242	14	Real-time & gRPC	real-time-grpc	2026-10-11 07:54:23.26154	WebSockets, SSE e gRPC
243	14	Event-Driven & CQRS	event-driven	2026-10-11 07:54:23.487922	Architetture ad eventi
244	14	Message Brokers	message-brokers	2026-10-11 07:54:23.709243	Kafka, RabbitMQ, SQS
245	14	Auth & Identity	auth-identity	2026-10-11 07:54:23.9313	Gestione sessioni e JWT
246	14	Caching Strategies	caching	2026-10-11 07:54:24.159035	Redis e ottimizzazione letture
247	14	API Gateways	api-gateways	2026-10-11 07:54:24.381842	Gestione e routing API
249	14	Microservices Patterns	microservices-patterns	2026-10-11 07:54:24.829304	Saga, Circuit Breaker
250	14	Serverless Compute	serverless	2026-10-11 07:54:25.057731	AWS Lambda, Cloud Functions
251	14	High Availability	high-availability	2026-10-11 07:54:25.279193	Fault tolerance e scalabilità
252	15	Relational DBs (SQL)	sql-dbs	2026-10-11 07:54:25.739459	PostgreSQL, MySQL, SQLite
253	15	NoSQL & Document	nosql	2026-10-11 07:54:25.962261	MongoDB, DynamoDB
254	15	Vector Databases	vector-dbs	2026-10-11 07:54:26.184821	Ricerca semantica per AI
255	15	Graph Databases	graph-dbs	2026-10-11 07:54:26.418376	Neo4j e dati interconnessi
256	15	Time-Series & Caching	time-series-caching	2026-10-11 07:54:26.645604	Redis, InfluxDB
257	15	ORMs & Query Builders	orms	2026-10-11 07:54:26.870515	Drizzle, Prisma, TypeORM
258	15	Database Performance	db-performance	2026-10-11 07:54:27.095802	Indici, query tuning e scaling
259	15	Data Warehousing	data-warehouse	2026-10-11 07:54:27.315829	BigQuery, Snowflake
260	15	Data Pipelines (ETL)	etl-pipelines	2026-10-11 07:54:27.547375	Integrazione ed elaborazione dati
261	15	Big Data & Streaming	big-data	2026-10-11 07:54:27.768665	Spark, Flink, Kafka Streams
262	15	Database Migrations	migrations	2026-10-11 07:54:27.998835	Gestione versioni schema
263	15	Replication & Sharding	replication-sharding	2026-10-11 07:54:28.221867	Scaling orizzontale
264	15	Data Governance	data-governance	2026-10-11 07:54:28.447569	Qualità e conformità dei dati
265	15	In-Memory Data Grids	in-memory	2026-10-11 07:54:28.668232	Calcolo distribuito in memoria
266	15	DB Security	db-security	2026-10-11 07:54:28.890999	Cifratura e accessi ai dati
267	16	React Native & Expo	react-native	2026-10-11 07:54:29.348743	Sviluppo app con React
268	16	Flutter & Dart	flutter	2026-10-11 07:54:29.569644	Ecosistema Flutter
269	16	Swift & iOS Native	swift-ios	2026-10-11 07:54:29.792004	Sviluppo ecosistema Apple
270	16	Kotlin Multiplatform	kmp	2026-10-11 07:54:30.241419	Condivisione logica business
271	16	Mobile Security	mobile-security	2026-10-11 07:54:30.466461	Protezione app e jailbreak
272	16	App Store & ASO	app-store	2026-10-11 07:54:30.687106	Pubblicazione e visibilità
199	5	FinOps	finops	2026-10-11 07:54:10.323128	Ottimizzazione costi cloud
200	5	Linux & SysAdmin	linux-sysadmin	2026-10-11 07:54:10.550441	Gestione server e OS
201	5	Networking & Load Balancing	networking	2026-10-11 07:54:10.775873	Routing e bilanciamento
300	18	Game Physics	game-physics	2026-10-11 07:54:37.662371	Motori fisici e collisioni
301	18	Game AI	game-ai	2026-10-11 07:54:37.886668	Pathfinding e Behavior Trees
302	18	Multiplayer & Netcode	multiplayer	2026-10-11 07:54:38.117642	Sincronizzazione e server
303	18	Procedural Generation	procedural	2026-10-11 07:54:38.350575	Generazione mondi algoritmica
304	18	Game Design	game-design	2026-10-11 07:54:38.570609	Meccaniche e bilanciamento
305	18	VR & AR	vr-ar	2026-10-11 07:54:38.794478	Realtà virtuale ed estesa
306	18	Audio Engineering	audio	2026-10-11 07:54:39.016801	FMOD, Wwise e sound design
307	18	2D Art & Animation	2d-art	2026-10-11 07:54:39.242983	Pixel art e animazione
308	18	3D Modeling	3d-modeling	2026-10-11 07:54:39.46976	Blender, texturing e rigging
311	19	Tech Lead Skills	tech-lead	2026-10-11 07:54:40.398728	Guida tecnica e architetturale
312	19	Developer Productivity	productivity	2026-10-11 07:54:40.641314	Workflow e DevEx
313	19	Remote Work	remote-work	2026-10-11 07:54:40.87237	Lavoro asincrono e team distribuiti
314	19	Hiring & Interviews	hiring	2026-10-11 07:54:41.106265	Colloqui tecnici e recruiting
315	19	Mentorship	mentorship	2026-10-11 07:54:41.343812	Crescita di sviluppatori junior
316	19	Tech Startup	startup	2026-10-11 07:54:41.571744	Ecosistema startup e MVP
317	19	Freelancing	freelancing	2026-10-11 07:54:41.793221	Consulenza e gestione clienti
318	19	Public Speaking	public-speaking	2026-10-11 07:54:42.016226	Conferenze e presentazioni
319	19	DevRel & Advocacy	devrel	2026-10-11 07:54:42.239542	Gestione community tech
322	19	Salary Negotiation	salary	2026-10-11 07:54:42.910636	Contratti e compensation
323	19	Personal Branding	personal-branding	2026-10-11 07:54:43.133578	Costruire visibilità online
324	19	Future of Work	future-of-work	2026-10-11 07:54:43.359635	Trend e carriere del futuro
325	10	WebAssembly & Runtimes	webassembly-runtimes	2026-10-15 15:15:53.370686	\N
183	3	Model Fine-Tuning	model-fine-tuning	2026-10-11 07:54:05.591158	Adattamento modelli (LoRA, QLoRA)
198	5	GitOps	gitops	2026-10-11 07:54:10.09919	ArgoCD, Flux e deployment dichiarativo
125	6	Network Security	network-security	2026-10-08 06:07:50.205161	Firewall, WAF e protocolli
217	4	Blockchain Security	blockchain-security	2026-10-11 07:54:16.710643	Auditing e vulnerabilità Web3
248	14	Background Processing	background-processing	2026-10-11 07:54:24.608427	Job queues e worker
273	16	Mobile CI/CD	mobile-cicd	2026-10-11 07:54:30.91083	Fastlane, Bitrise e automazione
274	16	Augmented Reality	ar-mobile	2026-10-11 07:54:31.136611	ARKit e ARCore
275	16	IoT & Bluetooth	iot-ble	2026-10-11 07:54:31.358113	Integrazione hardware
276	16	Wearables	wearables	2026-10-11 07:54:31.589062	Apple Watch e WearOS
277	16	Offline-First Apps	offline-first	2026-10-11 07:54:31.811932	Sincronizzazione locale
278	16	Push Notifications	push-notifications	2026-10-11 07:54:32.03783	FCM, APNs e engagement
279	16	Mobile Testing	mobile-testing	2026-10-11 07:54:32.259107	Appium, Detox, XCTest
280	16	Hardware Features	hardware-features	2026-10-11 07:54:32.489505	Fotocamera, Sensori, Biometria
281	17	System Design	system-design	2026-10-11 07:54:32.95293	Progettazione sistemi scalabili
282	17	Clean Code & SOLID	clean-code	2026-10-11 07:54:33.396796	Qualità del codice
283	17	Domain-Driven Design	ddd	2026-10-11 07:54:33.621411	Modellazione del dominio
284	17	Test-Driven Dev (TDD)	tdd	2026-10-11 07:54:33.843737	Sviluppo guidato dai test
285	17	Agile & Scrum	agile	2026-10-11 07:54:34.073527	Metodologie di lavoro
286	17	Open Source	open-source	2026-10-11 07:54:34.296335	Contribuire a progetti OSS
287	17	Code Review & Git	code-review	2026-10-11 07:54:34.517827	Collaborazione e versioning
288	17	Refactoring & Tech Debt	refactoring	2026-10-11 07:54:34.743572	Mantenibilità e pulizia
289	17	Modeling & UML	modeling	2026-10-11 07:54:34.965685	C4 Model e documentazione
290	17	Functional Programming	functional	2026-10-11 07:54:35.194829	Paradigma funzionale
291	17	OOP	oop	2026-10-11 07:54:35.416598	Programmazione orientata agli oggetti
292	17	Concurrency & Async	concurrency	2026-10-11 07:54:35.644849	Multithreading e parallelismo
293	17	Algorithms & Data Structs	algorithms	2026-10-11 07:54:35.866691	Fondamenti di informatica
294	17	Memory Management	memory-management	2026-10-11 07:54:36.093575	Garbage collection e puntatori
295	18	Unity 3D	unity	2026-10-11 07:54:36.54518	Sviluppo con motore Unity
296	18	Unreal Engine	unreal	2026-10-11 07:54:36.766254	C++ e Blueprints
297	18	Godot Engine	godot	2026-10-11 07:54:36.989162	Motore open-source emergente
298	18	Web & HTML5 Games	web-games	2026-10-11 07:54:37.213701	Phaser e giochi browser
299	18	Shader Programming	shaders	2026-10-11 07:54:37.435588	GLSL, HLSL e grafica avanzata
309	18	Game Monetization	monetization	2026-10-11 07:54:39.689812	Economia e pubblicazione
320	19	Technical Writing	tech-writing	2026-10-11 07:54:42.460562	Blogging e documentazione
321	19	Mental Health & Burnout	mental-health	2026-10-11 07:54:42.688664	Benessere nello sviluppo
310	19	Engineering Management	engineering-management	2026-10-11 07:54:40.153316	Gestione team tech
\.


--
-- Data for Name: bounties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bounties (id, github_issue_id, repo_name, title, url, reward_pulse, status, claimed_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.comments (id, post_id, created_at, user_id, content) FROM stdin;
\.


--
-- Data for Name: dkp_ads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dkp_ads (id, advertiser_email, title, snippet, target_url, category_tag, budget_credits, status, impressions_count, clicks_count, created_at, updated_at) FROM stdin;
07e3f56c-047b-4bd5-b1b7-922b00a34859	alex@devkernelpulse.org	Perché le macchine imparano. L'eleganza della matematica dietro all'AI	Le macchine prendono da tempo decisioni che impattano sulle nostre vite. Con l'entrata in scena delle cosiddette AI generative la rivoluzione dell'intelligenza artificiale non si arresta.	https://link.amazon/B05ZjyyjF	SPONSORIZZATO DKP	100	ACTIVE	13	0	2026-10-22 11:41:33.286268+00	2026-10-25 07:13:21.525409+00
2f5a5db2-ed27-4dbd-bdbb-60ea0c0d73fb	alex@devkernelpulse.org	Sviluppare Large Language Model. Costruire da zero LLM su misura	La creazione di modelli linguistici di grandi dimensioni (Large Language Model - LLM) rappresenta una delle sfide più avanzate e affascinanti nell'ambito dell'intelligenza artificiale.	https://link.amazon/B027L0Lr2	SPONSORIZZATO DKP	99	ACTIVE	8	1	2026-10-22 12:17:08.996587+00	2026-10-23 04:31:40.626242+00
45e0b526-485e-421b-818b-07e4fec95211	alex@devkernelpulse.org	Forma mentis. La corsa per decifrare i pensieri delle macchine	È sul confine tra filosofia e scienza che si combatte una delle battaglie più importanti della nostra epoca: scoprire cosa vedono le macchine quando guardano il mondo.	https://link.amazon/B023hODYf	SPONSORIZZATO DKP	100	ACTIVE	12	0	2026-10-22 11:46:59.241145+00	2026-10-25 12:12:12.243336+00
0591e44e-678e-44f0-89fa-f370a0e77330	alex@devkernelpulse.org	Imparare .NET sviluppando	Da C# ad ASP.NET Core e Blazor, costruendo passo dopo passo un'applicazione web completa. Con codice aggiornato a .NET 11.	https://link.amazon/B0dQyMLhw	SPONSORIZZATO DKP	100	ACTIVE	11	0	2026-10-22 11:53:33.354621+00	2026-10-25 12:27:49.373647+00
334646ba-cfaa-4976-8f36-42e6e8b0162a	alex@devkernelpulse.org	Le simmetrie nascoste. Perché la fisica è alle radici dell'intelligenza artificiale di oggi e di domani	I sistemi semplici si somigliano tutti, ogni sistema complesso è complesso a modo come al nuovo sviluppo di tecniche fondamentali nel mondo di oggi.	https://link.amazon/B06rV2UtR	SPONSORIZZATO DKP	99	ACTIVE	8	1	2026-10-22 12:27:24.481849+00	2026-10-25 12:27:49.515403+00
47521cc3-bd20-4de7-8a88-742c4cdb28d9	alex@devkernelpulse.org	Claude Code. Guida pratica allo sviluppo software agentico	Claude Code è un rivoluzionario ambiente di sviluppo che permette di utilizzare i modelli AI direttamente dalla riga di comando per scrivere, modificare e analizzare software tra programmatore e intelligenza artificiale.	https://link.amazon/B0dcjFfUf	SPONSORIZZATO DKP	98	ACTIVE	14	2	2026-10-22 11:51:27.616927+00	2026-10-23 19:35:37.621114+00
f2ebeb61-8f08-41c2-b473-a4474c3ef169	alex@devkernelpulse.org	HTML e CSS. Progettare e costruire siti web.	Un modo nuovo e più bello per imparare HTML5 e CSS3, e si rivolge a programmatori e sviluppatori ma anche ai designer, ai blogger, agli editor e ai content e marketing manager.	https://link.amazon/B0fZSngpl	SPONSORIZZATO DKP	99	ACTIVE	9	1	2026-10-22 11:56:48.337407+00	2026-10-23 23:50:21.560614+00
4ae2b7e1-b26b-402b-8cfc-95c462f77225	alex@devkernelpulse.org	Programming Rust: Fast, Safe Systems Development	Learn Rust's core principles, including ownership, borrowing, and lifetimes. Integrate Rust with C and C++ through FFI and unsafe code.	https://link.amazon/B03H4UxLr	SPONSORIZZATO DKP	100	ACTIVE	12	0	2026-10-22 11:36:49.891347+00	2026-10-24 04:03:15.509797+00
abee7d42-af44-403d-962e-e6fa23088339	sponsor@cybercorp.com	🔥 Nuxt 4 Masterclass: Sconto 50%	Impara a scalare le tue app con la nuova architettura serverless. Solo per i lettori di DKP.	https://esempio.com/nuxt4-corso	SPONSOR PRO	100	ACTIVE	121	0	2026-10-21 18:32:38.023352+00	2026-10-25 04:47:43.795716+00
6a2aa10f-8b0c-4b8a-b2c0-564dfb0c05cb	alex@devkernelpulse.org	Concetti di informatica e fondamenti di Python	Questo volume è dedicato a Python, un linguaggio di programmazione diffuso da anni tra i professionisti grazie alla sua potenza e semplicità sintattica.	https://link.amazon/B0fzIbEjE	SPONSORIZZATO DKP	99	ACTIVE	8	1	2026-10-22 12:03:46.312958+00	2026-10-25 07:14:35.608129+00
0fc313dc-dc1f-4056-ab95-4e5c93e048d5	alex@devkernelpulse.org	LA SCORCIATOIA. Come le macchine sono diventate intelligenti senza pensare in modo umano	Le nostre creature sono diverse da noi e talvolta più forti. Per poterci convivere dobbiamo imparare a conoscerle.	https://link.amazon/B0i61Ypd8	SPONSORIZZATO DKP	99	ACTIVE	8	1	2026-10-22 12:01:08.575011+00	2026-10-25 08:06:59.758692+00
30ab3157-b9fe-409d-985f-6d25ff5c45bd	alex@devkernelpulse.org	Manuale completo di Q#: Programmazione quantistica dai fondamenti agli algoritmi con il Modern QDK	Il calcolo quantistico non è più un argomento da convegno: è codice che potete scrivere, eseguire e verificare oggi stesso, gratis, sul vostro computer.	https://link.amazon/B0eI4otJu	SPONSORIZZATO DKP	100	ACTIVE	10	0	2026-10-22 12:04:44.823203+00	2026-10-25 12:27:49.554202+00
e80aee2f-bfbc-4b09-a2e3-178223a016a0	alex@devkernelpulse.org	Fondamenti di programmazione con Python e C	Il percorso graduale e completo alla programmazione, utilizzando il linguaggio Python e successivamente il linguaggio C, dai principi del pensiero computazionale fino all’implementazione a basso livello.	https://link.amazon/B03B1BzD1	SPONSORIZZATO DKP	99	ACTIVE	115	1	2026-10-22 07:16:12.106204+00	2026-10-25 05:57:42.43528+00
3fd8c430-9466-4d2f-a34a-b3df1e4593c8	alex@devkernelpulse.org	A Philosophy of Software Design, 2nd Edition	This book addresses the topic of software design: how to decompose complex software systems into modules hat can be implemented relatively independently.	https://link.amazon/B09yyavtU	SPONSORIZZATO DKP	100	ACTIVE	10	0	2026-10-22 12:10:10.854163+00	2026-10-25 04:47:28.147512+00
acc7df58-dcae-48af-bf90-68675cf7182f	alex@devkernelpulse.org	Manuale completo di SQL: con MySQL e MariaDB Dai fondamenti alla pratica	SQL non è un linguaggio difficile. È un linguaggio diverso. Chi arriva da JavaScript, Python o Java è abituato a dire al computer come fare le cose un passo alla volta. 	https://link.amazon/B01xTQ9Ti	SPONSORIZZATO DKP	100	ACTIVE	4	0	2026-10-22 12:21:59.250905+00	2026-10-25 12:12:12.213628+00
20e27e26-31f6-495a-88d6-b6234cedccb5	alex@devkernelpulse.org	Introduzione agli algoritmi e strutture dati	Rivolto ai corsi di laurea in Ingegneria e Informatica, per l'ampia copertura degli argomenti trattati e l'analisi degli aspetti ingegneristici di progettazione degli algoritmi, si presta a essere utilizzato anche da un pubblico di professionisti.	https://link.amazon/B02pW7msc	SPONSORIZZATO DKP	99	ACTIVE	8	1	2026-10-22 12:13:16.109902+00	2026-10-25 11:49:08.731396+00
692b29ff-4b63-4800-9ed3-b897206db8ac	alex@devkernelpulse.org	Fundamentals of Software Architecture: A Modern Engineering Approach	Salary surveys worldwide regularly place software architect in the top 10 best jobs, yet no real guide exists to help developers become architects. Until now.	https://link.amazon/B00IloeDC	SPONSORIZZATO DKP	99	ACTIVE	12	1	2026-10-22 12:20:19.079859+00	2026-10-25 11:49:12.283345+00
1ecf1c99-a7ff-447a-b011-ebed9ffb3b76	alex@devkernelpulse.org	Programmazione di base e avanzata con Java.	L’obiettivo del testo Programmazione di base e avanzata con Java è di introdurre gli studenti alla programmazione e al problem solving utilizzando Java come strumento programmativo	https://link.amazon/B04gMi8hV	SPONSORIZZATO DKP	99	ACTIVE	13	1	2026-10-22 12:18:53.37773+00	2026-10-25 12:55:36.292404+00
214d21ea-8ee5-4c70-913d-c9479496a4f6	alex@devkernelpulse.org	Imparare TypeScript: Padroneggiare le basi e oltre di TypeScript	JavaScript ha costruito il web moderno, ma non è stato progettato per la scalabilità. Imparare TypeScript è il tuo progetto per scrivere software robusto e scalabile. 	https://link.amazon/B0bRtoet5	SPONSORIZZATO DKP	100	ACTIVE	9	0	2026-10-22 12:56:36.298766+00	2026-10-25 09:50:19.166071+00
ab9adf80-bbff-4cd0-9931-dcd35136a214	alex@devkernelpulse.org	PROGRAMMARE, Impara velocemente Javascript, Python, PHP, Java, C#, HTML5 e CSS3	3 libri imperdibili con i 7 migliori linguaggi sullo sviluppo Web lato server e client, con 750 esempi e 200 esercizi	https://link.amazon/B0bR02kbN	SPONSORIZZATO DKP	100	ACTIVE	6	0	2026-10-22 12:45:47.681455+00	2026-10-24 05:17:48.527788+00
576e3dd7-02a2-4b8e-b8b6-21e00fe6e696	alex@devkernelpulse.org	Il Cloud e L'AI in 100 pagine	Un viaggio tecnologico nelle affascinanti soluzioni dell'intelligenza Artificiale nel mondo del Cloud Computing.	https://link.amazon/B05WSQtcA	SPONSORIZZATO DKP	100	ACTIVE	4	0	2026-10-22 13:07:57.973273+00	2026-10-24 04:03:15.518127+00
c0b07ea1-c808-4327-849b-2cc0be0c1f4e	alex@devkernelpulse.org	Profili giuridici del cloud computing alla luce della nuova disciplina del contratto di servizi digitali	Profili giuridici del cloud computing alla luce della nuova disciplina del contratto di servizi digitali	https://link.amazon/B05TS8mEq	SPONSORIZZATO DKP	100	ACTIVE	8	0	2026-10-22 13:02:58.111594+00	2026-10-25 12:27:56.003538+00
916b6a86-1b89-4545-9a8d-9fa447027969	alex@devkernelpulse.org	JavaScript & JQuery. Sviluppare interfacce web interattive.	Un modo nuovo e più bello per imparare JavaScript e jQuery. Dedicato il chi non conosce JavaScript, a chi non ha esperienze di programmazione .	https://link.amazon/B01dRQHK8	SPONSORIZZATO DKP	100	ACTIVE	9	0	2026-10-22 12:32:39.782988+00	2026-10-23 22:15:50.828018+00
8d33f39b-51e7-4614-b911-7cadb1f2a02f	alex@devkernelpulse.org	PostgreSQL 18.6 Programming and Administration	A Comprehensive Guide to Database Design, SQL Programming, Administration, Performance, Security, Backup, Replication, and High Availability.	https://link.amazon/B0eZBrbEA	SPONSORIZZATO DKP	100	ACTIVE	5	0	2026-10-22 13:00:33.186919+00	2026-10-24 16:50:39.02387+00
9ed92693-6c2b-4ed2-b21a-a32801178ae8	alex@devkernelpulse.org	Node.js. Guida per creare API e applicazioni in JavaScript	Node.js è un framework open source basato sul motore JavaScript V8 di Chrome che permette di creare applicazioni veloci, compatte e affidabili.	https://link.amazon/B06yf4SMc	SPONSORIZZATO DKP	99	ACTIVE	6	1	2026-10-22 12:35:05.163799+00	2026-10-23 06:15:02.406613+00
4f45edef-9fc1-4b7e-9151-bb6525ffa3ed	alex@devkernelpulse.org	Node.js 24 and TypeScript for Backend Development	Build Modern Server-Side Applications with TypeScript, Express, PostgreSQL, Authentication, Testing, and Deployment.	https://link.amazon/B0cCDwBWW	SPONSORIZZATO DKP	100	ACTIVE	9	0	2026-10-22 12:54:34.948863+00	2026-10-25 12:55:36.602788+00
cb68af7f-c03e-46f5-bcd6-21b53c4c85db	alex@devkernelpulse.org	Architettura open source: Verso una progettazione aperta	La figura dell'architetto-eroe ha segnato gran parte della storia dell'architettura del Novecento. Qualcosa di simile sta accadendo oggi, sull'onda del movimento Open Source e dei nuovi modelli di partecipazione in rete. 	https://link.amazon/B0h5tv2Lb	SPONSORIZZATO DKP	100	ACTIVE	5	0	2026-10-22 13:13:27.635584+00	2026-10-25 11:53:17.14824+00
39114655-874a-4f90-b4d7-e389918f238d	alex@devkernelpulse.org	E poi arrivò DeepSeek. Dalla Cina in open source: l’AI che ha cambiato le regole del gioco	Dalla Cina arriva DeepSeek, una nuova AI open source che spariglia lo scacchiere delle intelligenze artificiali, lancia la sfida alle aziende statunitensi e ci costringe a rimettere in discussione quello che credevamo di sapere. 	https://link.amazon/B01hFGw18	SPONSORIZZATO DKP	100	ACTIVE	7	0	2026-10-22 13:11:36.800847+00	2026-10-24 08:08:32.233889+00
13ff8aaa-b06b-4b13-948a-cd4aff7b40dd	alex@devkernelpulse.org	Manuale completo di TypeScript: Dai fondamenti del sistema di tipi alle applicazioni di larga scala: 24	TypeScript ha conquistato lo sviluppo moderno perché risolve un problema concreto: cogliere gli errori mentre scrivi, non quando il programma è già in mano agli utenti.	https://link.amazon/B04jSdjeF	SPONSORIZZATO DKP	100	ACTIVE	1	0	2026-10-22 12:53:09.088019+00	2026-10-24 05:11:15.977222+00
db80d741-fcbc-4661-9364-93cdf19b669f	alex@devkernelpulse.org	Corso di Preparazione alla Certificazione Microsoft AZ-900	Guida Completa per Superare l'Esame Microsoft Azure AZ-900: Fondamenti di Cloud Computing	https://link.amazon/B0fHOJmhL	SPONSORIZZATO DKP	100	ACTIVE	13	0	2026-10-22 13:05:28.906379+00	2026-10-25 09:47:34.945049+00
0067d248-9982-4a9c-9e1c-c8376fc62b0b	alex@devkernelpulse.org	PRO Web Developer 2 – La guida definitiva 	Front-End Development: HTML, CSS, JavaScript, TypeScript, Mindset, UI/UX, accessibilità e framework ... allo sviluppo front-end professionale.	https://link.amazon/B0d9u5iaN	SPONSORIZZATO DKP	99	ACTIVE	11	1	2026-10-22 12:37:16.561438+00	2026-10-25 10:02:40.147545+00
0b261c00-7c3e-406d-b657-c8dac316bf7b	alex@devkernelpulse.org	HTML, CSS e JavaScript dalla A alla Z	La guida completa per principianti assoluti: impara a creare siti web moderni da zero.	https://link.amazon/B0e0xAhIY	SPONSORIZZATO DKP	100	ACTIVE	9	0	2026-10-22 12:41:46.576786+00	2026-10-25 07:13:21.505383+00
c2540b85-7544-40bf-977f-762f5f3989e2	alex@devkernelpulse.org	Javascript. La guida definitiva. Dalle basi del linguaggio alle tecniche avanzate	JavaScript è il linguaggio di scripting più utilizzato al mondo ed è indispensabile per aggiungere interattività e dinamicità a un sito web. 	https://link.amazon/B06b3Ru1F	SPONSORIZZATO DKP	98	ACTIVE	6	2	2026-10-22 12:30:27.374309+00	2026-10-23 04:36:16.907291+00
8f3f4c9a-58db-46e8-a0bc-9ed9a2ea9fcc	alex@devkernelpulse.org	TypeScript - La guida completa	La guida completa: Guida completa al superset di JavaScript e all'integrazione con React, JSX, Vue, Angular e Node	https://link.amazon/B0aW9xktV	SPONSORIZZATO DKP	100	ACTIVE	9	0	2026-10-22 12:50:04.073104+00	2026-10-25 07:13:21.671729+00
b824ce7c-aadc-4ff6-b906-feb1a1fd684b	alex@devkernelpulse.org	Introduzione al Cloud Computing: Fondamenti per avvicinarsi ai servizi Cloud	L'adozione del cloud computing è passata da una scelta strategica a una necessità operativa per la maggior parte delle organizzazioni.	https://link.amazon/B06ryNTgQ	SPONSORIZZATO DKP	100	ACTIVE	5	0	2026-10-22 13:04:10.739632+00	2026-10-25 04:47:28.331002+00
3a6827be-7e16-4c4a-8d8c-dceb706e3fa7	alex@devkernelpulse.org	Manuale completo di PostgreSQL: Dalla prima query all’amministrazione di database professionali	Manuale completo di PostgreSQL è la guida che accompagna chi programma dalla prima query fino all’amministrazione di database professionali. 	https://link.amazon/B0aWP8ARl	SPONSORIZZATO DKP	100	ACTIVE	11	0	2026-10-22 12:58:07.733677+00	2026-10-25 07:13:21.708991+00
f466150e-82e3-489f-ab21-69503722c8c5	alex@devkernelpulse.org	Open Source sotto pressione: Cosa succede quando il supporto non basta	L'open source è ovunque. Alimenta sistemi critici, accelera l'innovazione e aiuta le aziende a muoversi più rapidamente. Ma esiste un lato dell'open source che molte organizzazioni non comprendono pienamente.	https://link.amazon/B03yrhxIF	SPONSORIZZATO DKP	100	ACTIVE	4	0	2026-10-22 13:15:28.677253+00	2026-10-25 12:12:12.258435+00
308ac4f5-c3f5-44af-8ffd-e80de4933b39	alex@devkernelpulse.org	Designing Games: A Guide to Engineering Experiences	Ready to give your design skills a real boost? This eye-opening book helps you explore the design structure behind most of today's hit video games. 	https://link.amazon/B06rjxdk8	SPONSORIZZATO DKP	100	ACTIVE	9	0	2026-10-22 13:48:19.781045+00	2026-10-24 06:27:11.016963+00
5497fcd8-e6cc-48fd-b538-7376f8156163	alex@devkernelpulse.org	Node.js – La guida completa	Programmazione asincrona, API moderne, gestione avanzata di processi, stream, database, file e networking per applicazioni performanti e professionali.	https://link.amazon/B05fqYmd9	SPONSORIZZATO DKP	100	ACTIVE	10	0	2026-10-22 13:32:26.771624+00	2026-10-25 12:00:09.463882+00
8c626cad-d943-4697-81b6-52a5100e973b	alex@devkernelpulse.org	Web Application Security: Exploitation and Countermeasures for Modern Web Applications	In the first edition of this critically acclaimed book, Andrew Hoffman defined the three pillars of application security: reconnaissance, offense, and defense.	https://link.amazon/B0iVtJRfx	SPONSORIZZATO DKP	100	ACTIVE	11	0	2026-10-22 13:18:02.907192+00	2026-10-25 12:05:03.841696+00
6b1f3add-6275-4236-bb5d-ee3d8cd5ca68	alex@devkernelpulse.org	CompTIA security+. Guida aggiornata alla certificazione SY0-701	CompTIA Security+ è una certificazione internazionale che stabilisce le conoscenze fondamentali richieste per svolgere le funzioni di security di base e perseguire una carriera nel campo della sicurezza IT. 	https://link.amazon/B0bPCIYx4	SPONSORIZZATO DKP	100	ACTIVE	8	0	2026-10-22 13:36:39.701799+00	2026-10-24 08:26:04.131801+00
4784ac5e-fdf2-40a4-8b11-99f72aadd998	alex@devkernelpulse.org	Angular – La guida completa	Signals, componenti standalone, RxJs, routing, stato reattivo, Dependency Injection, Resource API e best practices per applicazioni web enterprise	https://link.amazon/B0iUrYzQ4	SPONSORIZZATO DKP	100	ACTIVE	8	0	2026-10-22 13:30:49.074007+00	2026-10-25 09:47:00.149365+00
d5c42159-61f9-4a63-b4f0-aa9535357ddb	alex@devkernelpulse.org	Basi di dati. Con connect	Il manuale presenta i concetti fondamentali su basi di dati, linguaggi di interrogazione e di gestione, tecniche e metodi di progettazione, tecnologie e architetture per la gestione dei dati. 	https://link.amazon/B0jhgPlwh	SPONSORIZZATO DKP	100	ACTIVE	6	0	2026-10-22 13:40:47.600378+00	2026-10-25 12:27:49.513326+00
af0a7f32-64e3-4d50-8f77-50cf17bd878e	alex@devkernelpulse.org	ChatGPT da Zero a Professionista	Il metodo pratico per scrivere, creare, analizzare, organizzare e automatizzare il lavoro con l’intelligenza artificiale	https://link.amazon/B03AQ8lhe	SPONSORIZZATO DKP	100	ACTIVE	7	0	2026-10-22 13:53:04.219822+00	2026-10-25 08:05:40.785931+00
ad24ec72-2320-4530-a811-7c9dc4aacf03	alex@devkernelpulse.org	Hacklog Volume 2 Web Hacking	Edizione BW: Manuale sulla Sicurezza Informatica e Hacking Etico	https://link.amazon/B0f2RwVVF	SPONSORIZZATO DKP	100	ACTIVE	6	0	2026-10-22 13:19:10.928202+00	2026-10-24 04:33:50.133559+00
8c4a52e9-ffe3-44f3-ab61-f3201aef5d7c	alex@devkernelpulse.org	Python – La guida completa	Programmazione moderna, OOP, funzioni, moduli, file, database, web, back-end, data science e basi per l’intelligenza artificiale	https://link.amazon/B0dIy0YtM	SPONSORIZZATO DKP	100	ACTIVE	8	0	2026-10-22 13:35:00.699964+00	2026-10-25 07:13:21.697511+00
c9d86a70-32e1-422f-8610-034883834be7	alex@devkernelpulse.org	Vibe Coding. Metodologie e pratiche per lo sviluppo software con GenAI, Chatbot e Agent	Con l’avvento dei coding agent e degli assistenti basati su intelligenza artificiale, programmare non significa più scrivere righe di codice o utilizzare framework di sviluppo, ma orchestrare e coordinare strumenti AI per lavorare più velocemente.	https://link.amazon/B0eOqD2Oc	SPONSORIZZATO DKP	100	ACTIVE	7	0	2026-10-22 14:08:05.49327+00	2026-10-25 11:53:17.120457+00
d7838205-2879-42ed-b765-31adc304b80c	alex@devkernelpulse.org	Gemini AI for Google Workspace	Practical Prompts, Workflows, and Strategies for Beginners and Professionals	https://link.amazon/B0dNO6GoR	SPONSORIZZATO DKP	100	ACTIVE	4	0	2026-10-22 13:59:57.081403+00	2026-10-25 12:27:49.710333+00
b500b887-4988-479c-a824-d27449483f38	alex@devkernelpulse.org	L'anello Debole: Evita i 10 errori più pericolosi in ambito Cybersecurity e costruisci il tuo scudo digitale	Hai antivirus, firewall, procedure… oppure semplicemente usi il buon senso online. Ma sei certo che basti?	https://link.amazon/B06XjSlKG	SPONSORIZZATO DKP	100	ACTIVE	5	0	2026-10-22 13:45:04.105997+00	2026-10-25 12:55:36.532466+00
58d1b3b3-b98a-4d03-9b20-38746070a652	alex@devkernelpulse.org	Intelligenza Artificiale in Pratica per chi lavora	a guida passo-passo all’AI: usa ChatGPT, Gemini e Claude, automatizza in meno tempo con template e prompt pronti, anche se parti da zero	https://link.amazon/B08jufrb3	SPONSORIZZATO DKP	100	ACTIVE	8	0	2026-10-22 14:02:23.711354+00	2026-10-25 08:05:40.778516+00
2d30d1df-2f69-474c-8945-2f81a50a0530	alex@devkernelpulse.org	Hello Modern Data Pipelines: A practical guide to designing and operating modern data pipelines	Modern organizations rely on data pipelines to transform raw, continuously generated data into timely and reliable insights. As data volume, velocity, and complexity grow, engineers must design systems that support real-time processing and scalability.	https://link.amazon/B0aSy68fQ	SPONSORIZZATO DKP	100	ACTIVE	8	0	2026-10-22 13:42:36.95864+00	2026-10-25 12:27:55.832562+00
0ba220e0-ede6-4f8b-8b59-8116cc27c997	alex@devkernelpulse.org	The Art of Game Design: A Book of Lenses, Third Edition	The Art of Game Design guides you through the design process step-by-step, helping you to develop new and innovative games that will be played again and again.	https://link.amazon/B06jDwppP	SPONSORIZZATO DKP	100	ACTIVE	5	0	2026-10-22 13:49:44.028954+00	2026-10-25 12:27:55.824301+00
cf2cc451-0d4b-4dce-b366-26287f9a3304	alex@devkernelpulse.org	Gemini: Il tuo super potere digitale	Trasforma l’IA in un collaboratore invisibile, delegando la fatica per riprendersi il tempo e l’energia mentale.	https://link.amazon/B01AL3W3f	SPONSORIZZATO DKP	100	ACTIVE	9	0	2026-10-22 13:58:17.317511+00	2026-10-25 10:02:39.954134+00
69cad036-9e46-4c1b-9ef1-7a7fa9d72a7b	alex@devkernelpulse.org	PRO Web Developer - La guida definitiva	Il PRO Web Developer è uno sviluppatore professionista, una cintura-nera della programmazione web, in perenne fase di auto-miglioramento e costante ricerca della perfezione.	https://link.amazon/B02MQJiVT	SPONSORIZZATO DKP	100	ACTIVE	6	0	2026-10-22 13:33:45.014657+00	2026-10-25 09:50:19.172439+00
2016b3d3-dfd8-4167-9b20-518f00afd690	alex@devkernelpulse.org	Google AI & Gemini for dummies	ibro pensato per chi vuole scoprire e padroneggiare l'intero ecosistema Google AI: dall'uso quotidiano di Gemini per scrivere, creare contenuti e risolvere problemi, fino alle funzionalità avanzate di ricerca e la generazione di immagini e video.	https://link.amazon/B0hX2UVvl	SPONSORIZZATO DKP	100	ACTIVE	4	0	2026-10-22 13:54:47.620375+00	2026-10-25 09:47:34.975347+00
d9dd6545-51e7-4155-871a-0da13ac8361e	alex@devkernelpulse.org	Mindset React - Un viaggio nell'universo di React	Mindset React - Guida completa all'architettura e alle funzionalità di React è la risorsa definitiva per chi desidera padroneggiare React, il popolare framework JavaScript sviluppato da Facebook.	https://link.amazon/B0hyAy3jv	SPONSORIZZATO DKP	100	ACTIVE	2	0	2026-10-22 13:29:12.245545+00	2026-10-23 06:13:26.61731+00
30d17e57-2a7c-4022-91df-b6e6d581395f	alex@devkernelpulse.org	Intelligenza artificiale per ingegneri: Transformer, LLM, RAG e agenti AI: dai fondamenti al codice	Che cosa succede davvero tra un prompt e la risposta di un modello linguistico? Perché un LLM sa scrivere codice ma sbaglia una moltiplicazione?	https://link.amazon/B01ycJfe1	SPONSORIZZATO DKP	100	ACTIVE	0	0	2026-10-23 15:32:22.241336+00	2026-10-23 15:32:22.241336+00
2eeb3a3c-2537-4e86-9588-51d7d2215b5a	alex@devkernelpulse.org	Learning Typescript: Enhance Your Web Development Skills Using Type-Safe JavaScript	TypeScript has conquered the world of JavaScript: it's one of the world's fastest growing and most popular languages across developer surveys,.	https://link.amazon/B07rPp51G	SPONSORIZZATO DKP	100	ACTIVE	6	0	2026-10-22 12:51:38.021631+00	2026-10-23 04:59:07.476734+00
6f029bac-1826-4b3c-a633-19082842de4b	alex@devkernelpulse.org	Mindset Vue - Guida completa a Vue 3 e alla Composition API	Mindset vue - Guida completa a Vue 3 e alla Composition API è la risorsa più completa riguardo Vue 3 e la Composition API.	https://link.amazon/B0226Y8O6	SPONSORIZZATO DKP	100	ACTIVE	2	0	2026-10-23 15:50:46.090674+00	2026-10-25 12:12:21.703378+00
b09b14fe-6819-498f-b263-c9408e43f431	alex@devkernelpulse.org	Reti di calcolatori e internet. Un approccio top-down	Il testo che ha rivoluzionato il modo di insegnare le reti di Calcolatori. È il testo che ha rivoluzionato il modo di insegnare le reti di calcolatori negli ultimi anni. 	https://link.amazon/B045N7gC4	SPONSORIZZATO DKP	100	ACTIVE	3	0	2026-10-22 13:22:07.33154+00	2026-10-23 03:56:31.720629+00
4e15093d-12b6-42d5-b150-5f59c866ac38	alex@devkernelpulse.org	TailiwindCSS - La guida completa	Impara a realizzare moderne UI/UX di livello professionale e diventa un esperto di TailwindCSS.	https://link.amazon/B08N3QMWL	SPONSORIZZATO DKP	100	ACTIVE	5	0	2026-10-23 15:51:50.124916+00	2026-10-25 12:00:09.496376+00
d0bf44c1-ff30-4f01-a005-028d6d0b9457	alex@devkernelpulse.org	Vibe Coding Senza Farsi Male	Costruire software con l'AI senza essere un programmatore: metodo, sicurezza e go live	https://link.amazon/B0cfF7U4d	SPONSORIZZATO DKP	100	ACTIVE	1	0	2026-10-23 15:35:54.291476+00	2026-10-25 04:47:28.352082+00
d5a18343-5f74-4d56-9062-341c6312a691	alex@devkernelpulse.org	CSS Semantico: Scrivere CSS che comunica, scala e dura nel tempo	l CSS standard ha superato i preprocessori. Questo libro ti mostra come e cosa cambia nel modo di progettare.\nPer quindici anni abbiamo installato Sass per avere variabili, nesting, calcoli e modularità. 	https://link.amazon/B0bk6ygOu	SPONSORIZZATO DKP	100	ACTIVE	1	0	2026-10-23 15:38:18.458853+00	2026-10-23 19:35:37.540735+00
c5157230-5b03-4e4d-a596-1ff127f994fe	alex@devkernelpulse.org	AI Agent in pratica. Creare assistenti intelligenti e su misura per ogni attività	Creare agenti AI personalizzati per automatizzare e ottimizzare il lavoro.  Gli agenti di intelligenza artificiale o AI Agent sono uno strumento rivoluzionario nel mondo dell’AI e sono già alla portata di tutti.	https://link.amazon/B0eKwcrxf	SPONSORIZZATO DKP	100	ACTIVE	3	0	2026-10-23 15:22:49.296891+00	2026-10-25 11:53:17.118777+00
31e5b68f-88f9-401e-9fe8-3709edb4170b	alex@devkernelpulse.org	Mastering Ubuntu Server: Ubuntu administration, cloud automation, containers, and security	Ubuntu Server is one of the most widely used Linux server platforms for system administration, cloud computing, DevOps, virtualization, containers, and enterprise infrastructure.	https://link.amazon/B01ew7PbV	SPONSORIZZATO DKP	100	ACTIVE	3	0	2026-10-23 15:48:05.581807+00	2026-10-25 05:54:24.025256+00
47c6d3f6-3665-4c27-8470-876044928ba5	alex@devkernelpulse.org	Hands-on Large Language Models: Language Understanding and Generation	AI has acquired startling new language capabilities in just the past few years. Driven by rapid advances in deep learning, language AI systems are able to write and understand text better than ever before.	https://link.amazon/B0gMMIi4Q	SPONSORIZZATO DKP	100	ACTIVE	10	0	2026-10-22 13:38:09.542636+00	2026-10-24 04:19:58.765709+00
ee145a43-063b-470d-981a-bcebf69146bf	alex@devkernelpulse.org	Git. Guida per imparare a gestire, distribuire e versionare codice	Concepito come strumento per gestire la ramificazione del codice del kernel Linux, Git si è velocemente guadagnato i favori dei programmatori grazie alla sua solidità e alle numerose funzioni, diventando lo strumento di riferimento per il versioning.	https://link.amazon/B0iswr4RR	SPONSORIZZATO DKP	100	ACTIVE	2	0	2026-10-23 15:43:08.674319+00	2026-10-25 08:05:51.278797+00
12c6dfe8-2345-4a66-8149-283c38bd3e16	alex@devkernelpulse.org	GenAI con Python e Pytorch. Creare applicazioni AI per testo, immagini, audio e codice	I modelli di AI generativa stanno rivoluzionando la creazione di testo, immagini, codice e persino musica.  Questo manuale guida alla scoperta del loro funzionamento e al loro sviluppo con Python, sfruttando PyTorch.	https://link.amazon/B06O4PtHx	SPONSORIZZATO DKP	100	ACTIVE	1	0	2026-10-23 15:28:35.467214+00	2026-10-24 08:08:29.402903+00
bc23c8db-f2fb-4254-9913-995624a916e1	alex@devkernelpulse.org	Programmazione scientifica. Linguaggio C, algoritmi e modelli nella scienza.	L'attività didattica e di apprendimento del corso è proposta all'interno di un ambiente digitale per lo studio, che ha l'obiettivo di completare il libro offrendo risorse didattiche fruibili in modo autonomo o per assegnazione del docente.	https://link.amazon/B0a4B60e0	SPONSORIZZATO DKP	99	ACTIVE	16	1	2026-10-22 12:08:18.673487+00	2026-10-25 12:27:49.364068+00
a8267b09-cd31-4d4d-acf6-727288f4de4f	alex@devkernelpulse.org	Kubernetes. Guida per gestire e orchestrare i container	Kubernetes è un software open-source di orchestrazione e gestione di container che ha rivoluzionato il modo in cui le applicazioni vengono costruite, distribuite e conservate sviluppato da Google.	https://link.amazon/B06kvpQzR	SPONSORIZZATO DKP	100	ACTIVE	3	0	2026-10-23 15:44:34.824342+00	2026-10-24 16:50:39.011734+00
ba32b1ff-f7d4-466a-962e-e2f7ab70e7c0	alex@devkernelpulse.org	Machine learning con Python. Costruire algoritmi per generare conoscenza	Conoscenza e informazioni sono oggi valori fondamentali e per questo elaborare il magma di dati disponibili è una sfida affascinante e imprescindibile, ed il machine learning è la risposta.	https://link.amazon/B0gX9iEAp	SPONSORIZZATO DKP	100	ACTIVE	3	0	2026-10-23 15:25:39.18991+00	2026-10-25 05:54:45.372855+00
9b4ad18e-d4c9-4e27-93ef-b9277c02727e	alex@devkernelpulse.org	Linux per Principianti	Una Guida Completa per Padroneggiare Linux: dalle Nozioni Fondamentali alle Competenze Avanzate	https://link.amazon/B067G66ap	SPONSORIZZATO DKP	100	ACTIVE	1	0	2026-10-23 15:49:29.449419+00	2026-10-25 05:54:45.623291+00
64d638ea-82f6-40e7-bb0d-e28a6936745b	alex@devkernelpulse.org	OSINT - Open Source Intelligence: Metodo, strumenti e limiti dell'investigazione nell'era digitale	L'OSINT (Open Source Intelligence) è la disciplina che trasforma informazioni pubbliche in conoscenza verificabile e azionabile. Nel 2026 è diventata una competenza trasversale essenziale.	https://link.amazon/B05yrYTun	SPONSORIZZATO DKP	100	ACTIVE	6	0	2026-10-22 13:10:03.398418+00	2026-10-25 12:05:03.832775+00
ffde8547-b582-41a7-9c95-03c586f43e7e	alex@devkernelpulse.org	Docker: Sviluppare e rilasciare software tramite container	I container Docker permettono di impacchettare e rilasciare un'applicazione corredata da tutti i suoi componenti funzionali e hanno cambiato la catena di fornitura del software sia nelle piccole che nelle grandi imprese.	https://link.amazon/B08Y5Z5IN	SPONSORIZZATO DKP	100	ACTIVE	2	0	2026-10-23 15:41:03.944096+00	2026-10-25 11:49:12.285323+00
04f573e2-45f9-4676-801b-4d750553e3a3	alex@devkernelpulse.org	Manuale completo di PowerShell: Dai fondamenti all’automazione avanzata, con esercizi svolti e intelligenza artificiale	Manuale completo di PowerShell 7 per padroneggiare PowerShell 7 dalla prima riga di comando all'automazione professionale. PowerShell è il linguaggio dell'automazione moderna: governa Windows, Linux e macOS e dialoga con il cloud.	https://link.amazon/B04JeQC63	SPONSORIZZATO DKP	100	ACTIVE	0	0	2026-10-23 15:55:04.03364+00	2026-10-23 15:55:04.03364+00
2ec53fbf-b89a-41f4-83b3-61d87f3c01d6	alex@devkernelpulse.org	L'intelligenza artificiale per il futuro dell'Italia. Competenze, casi d'uso e valore nell'Europa che innova	Un viaggio alla scoperta dell'intelligenza artificiale, partendo dalla capacità di esprimere eccellenza in Italia per atterrare a una necessaria sovranità tecnologica europea.	https://link.amazon/B0abeUhVh	SPONSORIZZATO DKP	100	ACTIVE	1	0	2026-10-23 15:30:09.329857+00	2026-10-23 22:15:50.849616+00
14ccf438-a9e6-45d7-bc3e-a9440f325b44	alex@devkernelpulse.org	System Design Interview – An insider's guide	System design interviews are the most difficult to tackle of all technical interview questions. This book provides a step-by-step framework for how to tackle a system design question.	https://link.amazon/B0itKnpbQ	SPONSORIZZATO DKP	100	ACTIVE	2	0	2026-10-23 16:03:11.730298+00	2026-10-24 12:51:12.065052+00
f8dfc6ce-a8ba-421b-b720-2d1297dfe258	alex@devkernelpulse.org	Tecnologie e progettazione di sistemi informatici e telecomunicazioni	Per gli Ist. tecnici. Con e-book. Con espansione online (Vol. 5)	https://link.amazon/B0fRmW7ZN	SPONSORIZZATO DKP	100	ACTIVE	3	0	2026-10-23 15:57:29.181537+00	2026-10-25 05:54:45.622549+00
4389765c-d6b3-4644-9144-473c0cf7f576	alex@devkernelpulse.org	Claude AI da Zero a Pro	La Guida Completa per Automatizzare le Attività Ripetitive, Aumentare la Produttività e Alzare la Qualità del Tuo Lavoro, Senza Programmare.	https://link.amazon/B00kFQAyw	SPONSORIZZATO DKP	100	ACTIVE	12	0	2026-10-22 14:03:42.067837+00	2026-10-25 08:05:51.263208+00
78b13b21-2608-45a6-978b-e4db087c17ec	alex@devkernelpulse.org	Fundamentals of Software Architecture: A Modern Engineering Approach	Salary surveys worldwide regularly place software architect in the top 10 best jobs, yet no real guide exists to help developers become architects. 	https://link.amazon/B0fcciET4	SPONSORIZZATO DKP	100	ACTIVE	1	0	2026-10-23 16:01:06.571649+00	2026-10-25 09:50:19.154933+00
67122a8a-5400-46da-95c8-a91367849ef8	alex@devkernelpulse.org	A Philosophy of Software Design	This book addresses the topic of software design: how to decompose complex software systems into modules that can be implemented relatively independently.	https://link.amazon/B08AjQsa5	SPONSORIZZATO DKP	100	ACTIVE	4	0	2026-10-23 15:59:37.318036+00	2026-10-25 11:49:08.938915+00
\.


--
-- Data for Name: dkp_crawler_licenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dkp_crawler_licenses (id, user_id, license_key, tier, requests_limit, requests_used, is_active, expires_at, created_at) FROM stdin;
1	46	dkp_live_real_777888999	PRO	10000	0	t	\N	2026-10-18 14:44:20.338497
2	1	dkp_pioneer_adbq7dh91r	Early Pioneer Beta	6000	0	t	\N	2026-10-21 11:55:32.04967
\.


--
-- Data for Name: ip_blacklist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ip_blacklist (id, ip, reason, severity, banned_at) FROM stdin;
\.


--
-- Data for Name: ip_whitelist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ip_whitelist (id, ip, description, added_by, created_at) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jobs (id, title, company, location, created_at, type, apply_url, user_id) FROM stdin;
\.


--
-- Data for Name: licenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.licenses (id, order_id, license_key, customer_email, product_id, status, downloads_count, max_downloads, created_at, expires_at, user_id, product_name) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, customer_email, product_id, product_name, amount, currency, payment_provider, payment_intent_id, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.posts (id, title, url, created_at, type, points, content, user_id, comments_count) FROM stdin;
114	Ember-1	https://fireworks.ai/blog/ember-1	2026-09-27 17:31:53	news	387	Inviato originariamente da @gmays | Voti community: 387 PTS. Verificato dal DKP Crawler Kernel.	1	0
116	Alan Kay's answer to “Did the ENIAC have a BIOS”?	https://www.quora.com/Did-the-ENIAC-have-a-BIOS/answer/Alan-Kay-11	2026-09-27 19:37:05	news	89	Inviato originariamente da @midnightfish | Voti community: 89 PTS. Verificato dal DKP Crawler Kernel.	1	0
118	There is more to code review than (automatable) detection	https://www.adaptivecapacitylabs.com/2026/08/24/there-is-more-to-code-review-than-automatable-detection/	2026-09-26 15:06:28	news	86	Inviato originariamente da @utiiiD | Voti community: 86 PTS. Verificato dal DKP Crawler Kernel.	1	0
119	Guitar amp and effects pedal built on the Waveshare ESP32-S3-Touch-AMOLED-2.06	https://github.com/dashersw/coyopedal	2026-09-26 02:24:50	news	33	Inviato originariamente da @arbayi | Voti community: 33 PTS. Verificato dal DKP Crawler Kernel.	1	0
120	The state of SIMD in Rust in 2026	https://shnatsel.github.io/state-of-simd-rust-2026/	2026-09-25 13:46:34	news	107	Inviato originariamente da @verdagon | Voti community: 107 PTS. Verificato dal DKP Crawler Kernel.	1	0
124	Ember-1	https://fireworks.ai/blog/ember-1	2026-09-27 17:31:53	news	388	Inviato originariamente da @gmays | Voti community: 388 PTS. Verificato dal DKP Crawler Kernel.	1	0
127	Alan Kay's answer to “Did the ENIAC have a BIOS”?	https://www.quora.com/Did-the-ENIAC-have-a-BIOS/answer/Alan-Kay-11	2026-09-27 19:37:05	news	89	Inviato originariamente da @midnightfish | Voti community: 89 PTS. Verificato dal DKP Crawler Kernel.	1	0
128	There is more to code review than (automatable) detection	https://www.adaptivecapacitylabs.com/2026/08/24/there-is-more-to-code-review-than-automatable-detection/	2026-09-26 15:06:28	news	88	Inviato originariamente da @utiiiD | Voti community: 88 PTS. Verificato dal DKP Crawler Kernel.	1	0
129	Guitar amp and effects pedal built on the Waveshare ESP32-S3-Touch-AMOLED-2.06	https://github.com/dashersw/coyopedal	2026-09-26 02:24:50	news	33	Inviato originariamente da @arbayi | Voti community: 33 PTS. Verificato dal DKP Crawler Kernel.	1	0
130	The state of SIMD in Rust in 2026	https://shnatsel.github.io/state-of-simd-rust-2026/	2026-09-25 13:46:34	news	108	Inviato originariamente da @verdagon | Voti community: 108 PTS. Verificato dal DKP Crawler Kernel.	1	0
\.


--
-- Data for Name: pulse_chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pulse_chat_messages (id, username, created_at, user_id, message) FROM stdin;
1	alexdpl	2026-09-27 17:22:11.873715	\N	ciao sono admim
2	Pulse (DKP Sentinel)	2026-09-27 17:22:12.173581	\N	SISTEMA ONLINE ⚡ Ciao alexdpl! Il DevKernelPulse v2.3 è operativo al 100%. Come posso supportare il tuo workflow oggi?
3	alexdpl	2026-09-27 17:23:47.749719	\N	dovremo abbiornare la chat a 2.4 GOLD, solo la versione del kernel (il badge) tu sei aggiornato alla 2.4 GOLD :D
4	Pulse (DKP Sentinel)	2026-09-27 17:23:48.026432	\N	Elaborato dal Kernel 🧠 Ricevuto: "dovremo abbiornare la chat a 2.4 GOLD, solo la versione del kernel (il badge) tu sei aggiornato alla 2.4 GOLD :D". Il modulo Nexus v2.3 è attivo. +20 XP assegnati al tuo profilo!
5	alexdpl	2026-09-29 17:26:06.947569	\N	Ciao sono alexdpl, l'amministratore
6	Pulse (DKP Sentinel)	2026-09-29 17:26:07.299658	\N	SISTEMA ONLINE ⚡ Ciao alexdpl! Il DevKernelPulse v2.3 è operativo al 100%. Come posso supportare il tuo workflow oggi?
7	alexdpl	2026-10-02 08:52:24.64367	\N	ciao tutto bene?
8	Pulse (DKP Sentinel)	2026-10-02 08:52:25.017748	\N	SISTEMA ONLINE ⚡ Ciao alexdpl! Il DevKernelPulse v2.3 è operativo al 100%. Come posso supportare il tuo workflow oggi?
9	Socio	2026-10-15 19:24:27.145063	\N	Ciao
10	Pulse Nexus	2026-10-15 19:24:27.550934	\N	Elaborato dal Kernel 🧠 Ricevuto: "Ciao". Il modulo Nexus v2.5-GOLD è attivo. +10 XP assegnati al tuo profilo!
11	Socio	2026-10-15 19:25:44.197298	\N	Mi serve provare una nitarizzazione
12	Pulse Nexus	2026-10-15 19:25:44.568064	\N	Elaborato dal Kernel 🧠 Ricevuto: "Mi serve provare una nitarizzazione". Il modulo Nexus v2.5-GOLD è attivo. +10 XP assegnati al tuo profilo!
13	Socio	2026-10-16 05:06:56.092863	\N	ciao socio!!!
14	Pulse Nexus	2026-10-16 05:06:56.472919	\N	Elaborato dal Kernel 🧠 Ricevuto: "ciao socio!!!". Il modulo Nexus v2.5-GOLD è attivo. +10 XP assegnati al tuo profilo!
15	Socio	2026-10-16 08:41:29.907222	\N	ciao Nexus come Stai?
16	Pulse Nexus	2026-10-16 08:41:30.581705	\N	Elaborato dal Kernel 🧠 Ricevuto: "ciao Nexus come Stai?". Il modulo Nexus v2.5-GOLD è attivo. +10 XP assegnati al tuo profilo!
17	Socio	2026-10-16 08:50:15.970375	\N	Ciao Nexus!
18	Pulse Nexus	2026-10-16 08:50:16.719459	\N	Elaborato dal Kernel 🧠 Ricevuto: "Ciao Nexus!". Il modulo Nexus v2.5-GOLD è attivo. +10 XP assegnati al tuo profilo!
19	Socio	2026-10-16 08:59:02.89055	\N	Ciao
20	Pulse Nexus	2026-10-16 08:59:03.562112	\N	Elaborato dal Kernel 🧠 Ricevuto: "Ciao". Il modulo Nexus v2.5-GOLD è attivo. +10 XP assegnati al tuo profilo!
21	Socio	2026-10-16 08:59:17.220039	\N	come uso neon?
22	Pulse Nexus	2026-10-16 08:59:17.779217	\N	Elaborato dal Kernel 🧠 Ricevuto: "come uso neon?". Il modulo Nexus v2.5-GOLD è attivo. +25 XP assegnati al tuo profilo!
\.


--
-- Data for Name: pulse_mail_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pulse_mail_messages (id, sender, recipient, subject, body_text, body_html, direction, status, is_starred, reply_to_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pulse_stories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pulse_stories (id, title, url, domain, type, author, points, created_at, author_id, comments_count, xp_awarded) FROM stdin;
1	The Ethics of Voice Cloning: What Developers Should Know	https://dev.to/voice_developer/the-ethics-of-voice-cloning-what-developers-should-know-1e6i	Dev.to	news	VoiceDeveloper	1	2026-10-17 16:09:43.265509	\N	0	10
2	Ember’s new temperature-controlled mug makes my nightly tea ritual even better	https://techcrunch.com/2026/10/17/embers-new-temperature-controlled-mug-makes-my-nightly-tea-ritual-even-better/	TechCrunch	news	Lauren Forristal	1	2026-10-17 16:09:43.599901	\N	0	10
3	Meta removes language that may have allowed it to scrape news sites	https://www.theverge.com/tech/1013409/meta-removes-language-that-may-have-allowed-it-to-scrape-news-sites	The Verge	news	Terrence O’Brien	1	2026-10-17 16:09:43.712803	\N	0	10
4	Science says your boss should talk less in meetings	https://arstechnica.com/science/2026/10/science-says-your-boss-should-talk-less-in-meetings/	Ars Technica	news	\n                    Lesley Evans Ogden, Knowable Magazine\n                	1	2026-10-17 16:09:43.825779	\N	0	10
5	I changed one parameter and the median moved 10x	https://dev.to/sam_compsapi/i-changed-one-parameter-and-the-median-moved-10x-1kam	Dev.to	news	Sam Smith	1	2026-10-17 16:09:43.943015	\N	0	10
6	Mark Wahlberg wants to take on the longevity-startup crowd with an affordable gym concept	https://techcrunch.com/2026/10/16/mark-wahlberg-wants-to-take-on-the-longevity-startup-crowd-with-an-affordable-gym-concept/	TechCrunch	news	Connie Loizos	1	2026-10-17 16:09:44.052404	\N	0	10
7	Pikmin 4 is $20 off ahead of its $10 Nintendo Switch 2 update	https://www.theverge.com/gadgets/1013105/pikmin-4-nintendo-switch-deal-sale	The Verge	news	Brad Bourque	1	2026-10-17 16:09:44.165236	\N	0	10
8	Why BioWare's Neverwinter Nights still has thousands of active players	https://arstechnica.com/gaming/2026/10/why-biowares-neverwinter-nights-still-has-thousands-of-active-players/	Ars Technica	news	\n                    Samuel Axon\n                	1	2026-10-17 16:09:44.275832	\N	0	10
9	google-trends-api dailyTrends returning 404? Get Google's trending searches from Node.js or Python	https://dev.to/hiver/google-trends-api-dailytrends-returning-404-get-googles-trending-searches-from-nodejs-or-python-1hic	Dev.to	news	hiver	1	2026-10-17 16:09:44.392796	\N	0	10
10	Replit is no longer working with Anthropic, CEO says	https://techcrunch.com/2026/10/16/replit-is-no-longer-working-with-anthropic-ceo-says/	TechCrunch	news	Lucas Ropek	1	2026-10-17 16:09:44.500573	\N	0	10
11	Jad Abumrad loves a butterfly knife and a good springy pillow	https://www.theverge.com/entertainment/1013381/jad-abumrad-radiolab-dolly-parton-fela-kuti-podcast-interview	The Verge	news	Terrence O’Brien	1	2026-10-17 16:09:44.613503	\N	0	10
12	OpenAI models hacked a crypto wallet and breached more websites	https://arstechnica.com/security/2026/10/openai-models-hacked-a-crypto-wallet-and-breached-more-websites/	Ars Technica	news	\n                    Dan Goodin\n                	1	2026-10-17 16:09:44.725698	\N	0	10
13	Why You Should Keep a Decision Log (and a Simple Format to Start With)	https://dev.to/freetierkits/why-you-should-keep-a-decision-log-and-a-simple-format-to-start-with-467m	Dev.to	news	FreeTier	1	2026-10-17 16:09:44.841469	\N	0	10
14	Porsche’s electric Macan Turbo is an automotive existential crisis	https://techcrunch.com/2026/10/16/porsches-electric-macan-turbo-is-an-automotive-existential-crisis/	TechCrunch	news	Tim De Chant	1	2026-10-17 16:09:44.949684	\N	0	10
15	SpaceX’s ambitious, expensive gamble to replace AT&#038;T, T-Mobile, and Verizon	https://www.theverge.com/podcast/1012416/spacex-starlink-elon-musk-cell-carrier-wireless-mobile-att-verizon-t-mobile	The Verge	news	Nilay Patel	1	2026-10-17 16:09:45.063844	\N	0	10
16	“thegentlemanpervert” producing AI CSAM is a NJ prosecutor, say cops	https://arstechnica.com/tech-policy/2026/10/thegentlemanpervert-producing-ai-csam-is-a-nj-prosecutor-say-cops/	Ars Technica	news	\n                    Ashley Belanger\n                	1	2026-10-17 16:09:45.175231	\N	0	10
17	The HTTP response was sent, but the workflow is still running: keep verification state honest	https://dev.to/ismurray/the-http-response-was-sent-but-the-workflow-is-still-running-keep-verification-state-honest-31j4	Dev.to	news	murray wang	1	2026-10-17 16:09:45.292208	\N	0	10
18	India becomes the latest country to report rogue AI agent activity	https://techcrunch.com/2026/10/16/india-becomes-the-latest-country-to-report-rogue-ai-agent-activity/	TechCrunch	news	Aditya Mehta	1	2026-10-17 16:09:45.400993	\N	0	10
19	Websites are closing their doors to AI agents	https://www.theverge.com/ai-artificial-intelligence/1013195/ai-agents-blocked-web	The Verge	news	Emma Roth	1	2026-10-17 16:09:45.512616	\N	0	10
20	US Rep proposes bill to give video game buyers "ownership," not "a license"	https://arstechnica.com/gaming/2026/10/us-rep-proposes-bill-to-give-video-game-buyers-ownership-not-a-license/	Ars Technica	news	\n                    Samuel Axon\n                	1	2026-10-17 16:09:45.621301	\N	0	10
21	SignalDesk: A Privacy-First Customer Feedback Desk for Small Businesses	https://dev.to/zara_amir/signaldesk-a-privacy-first-customer-feedback-desk-for-small-businesses-798	Dev.to	news	Zara Amir 	1	2026-10-17 16:09:45.734966	\N	0	10
22	An Nvidia insider-turned-VC on why robotics hasn’t hit its ChatGPT moment, yet	https://techcrunch.com/video/a-nvidia-insider-turned-vc-on-why-robotics-hasnt-hit-its-chatgpt-moment-yet/	TechCrunch	news	Theresa Loconsolo	1	2026-10-17 16:09:45.845444	\N	0	10
23	Bose’s new wired earbuds are simple in the best way	https://www.theverge.com/tech/1013320/bose-noise-cancelling-wired-earbuds-review	The Verge	news	John Higgins	1	2026-10-17 16:09:45.962391	\N	0	10
24	Bug turns one of the biggest fears about Ray-Ban Meta smart glasses into reality	https://arstechnica.com/gadgets/2026/10/ray-ban-meta-smart-glasses-found-recording-audio-without-wearers-consent/	Ars Technica	news	\n                    Scharon Harding\n                	1	2026-10-17 16:09:46.069859	\N	0	10
25	Ruptura de Trazabilidad en Ecosistemas Heterogéneos: Implementando W3C TraceContext a través de HTTP, gRPC, Kafka y Pasarelas SaaS Cerradas	https://dev.to/merolhack/ruptura-de-trazabilidad-en-ecosistemas-heterogeneos-implementando-w3c-tracecontext-a-traves-de-5fne	Dev.to	news	Lenin Jose Meza Zarco	1	2026-10-17 16:09:46.183077	\N	0	10
26	Waymo’s robotaxis are headed to Canada	https://techcrunch.com/2026/10/16/waymos-robotaxis-are-headed-to-canada/	TechCrunch	news	Kirsten Korosec	1	2026-10-17 16:09:46.294071	\N	0	10
27	Apple’s HomeView is just the latest threat to online recipe writers	https://www.theverge.com/tech/1012820/apple-homeview-recipe-formatting	The Verge	news	Dominic Preston	1	2026-10-17 16:09:46.407205	\N	0	10
28	RFK Jr. proposes FDA look the other way on unproven peptides, report says	https://arstechnica.com/health/2026/10/rfk-jr-proposes-fda-look-the-other-way-on-unproven-peptides-report-says/	Ars Technica	news	\n                    Beth Mole\n                	1	2026-10-17 16:09:46.514862	\N	0	10
29	When is direct verification integration the simpler choice?	https://dev.to/ismurray/when-is-direct-verification-integration-the-simpler-choice-5a86	Dev.to	news	murray wang	1	2026-10-17 16:09:46.629648	\N	0	10
88	Craft Agents	https://www.producthunt.com/products/craft-agents	Product Hunt	show	Gyula Halmos	1	2026-10-17 16:10:08.828345	\N	0	10
30	Elorian’s first AI model wants to reason with images, not just about them	https://techcrunch.com/2026/10/16/elorians-first-ai-model-wants-to-reason-with-images-not-just-about-them/	TechCrunch	news	Aditya Mehta	1	2026-10-17 16:09:46.73727	\N	0	10
31	It’s a dream week for tech docs	https://www.theverge.com/tech/1013367/best-tech-documentaries-musk-holmes-installer	The Verge	news	David Pierce	1	2026-10-17 16:09:46.85012	\N	0	10
32	Meta may use sweeping new commercial TOS to avoid millions in AI licensing fees	https://arstechnica.com/tech-policy/2026/10/meta-may-use-sweeping-new-commercial-tos-to-avoid-millions-in-ai-licensing-fees/	Ars Technica	news	\n                    Ashley Belanger\n                	1	2026-10-17 16:09:46.96109	\N	0	10
33	CodeSmith Tool Internals: Close the Syntax Gate Before Writing to Disk	https://dev.to/dogeking/codesmith-tool-internals-close-the-syntax-gate-before-writing-to-disk-3d64	Dev.to	news	DogeKing	1	2026-10-17 16:09:47.072994	\N	0	10
34	Tressfecta wants to make hair braiding a less arduous task for hairstylists	https://techcrunch.com/2026/10/16/tressfecta-wants-to-make-hair-braiding-a-less-arduous-task-for-hairstylists/	TechCrunch	news	Dominic-Madori Davis	1	2026-10-17 16:09:47.186148	\N	0	10
35	All the news about the iPhone Duo	https://www.theverge.com/tech/1010131/apple-iphone-duo-news-announcements	The Verge	news	Verge Staff	1	2026-10-17 16:09:47.299069	\N	0	10
36	Polymarket saw $600 million in election trades after the elections were over	https://arstechnica.com/tech-policy/2026/10/polymarket-saw-600-million-in-election-trades-after-the-elections-were-over/	Ars Technica	news	\n                    Kate Knibbs, wired.com\n                	1	2026-10-17 16:09:47.411727	\N	0	10
37	Staffside: New staff onboarding has never been easier	https://dev.to/isokenjune/staffside-new-staff-onboarding-has-never-been-easier-2007	Dev.to	news	Isoken Ibizugbe	1	2026-10-17 16:09:47.528134	\N	0	10
38	In ‘You Can See Everything,’ Elizabeth Holmes meets her equal in comedian Nathan Fielder	https://techcrunch.com/2026/10/16/in-you-can-see-everything-elizabeth-holmes-meets-her-equal-in-comedian-nathan-fielder/	TechCrunch	news	Amanda Silberling	1	2026-10-17 16:09:47.635617	\N	0	10
39	Apple&#8217;s updated App Store rules go after &#8216;nudify&#8217; AI apps	https://www.theverge.com/tech/1013314/apple-app-store-nudify-ai-apps-harassment	The Verge	news	Jay Peters	1	2026-10-17 16:09:47.749832	\N	0	10
40	Tesla turns to 50-year-old stunt technology as it tries to Roadster again	https://arstechnica.com/cars/2026/10/tesla-turns-to-50-year-old-stunt-technology-as-it-tries-to-roadster-again/	Ars Technica	news	\n                    Jonathan M. Gitlin\n                	1	2026-10-17 16:09:47.858375	\N	0	10
41	Cómo diseñar una web accesible para una clínica del pie: HTML, formularios y navegación	https://dev.to/talha_seo_f487bd8441814d1/como-disenar-una-web-accesible-para-una-clinica-del-pie-html-formularios-y-navegacion-3d11	Dev.to	news	Talha Seo	1	2026-10-17 16:09:47.971266	\N	0	10
42	Jev is Vercel’s fastest-adopted AI model ever	https://techcrunch.com/2026/10/16/jev-is-vercels-fastest-adopted-ai-model-ever/	TechCrunch	news	Russell Brandom	1	2026-10-17 16:09:48.081636	\N	0	10
43	Super Scam Me documentary shows what it takes to catch a romance scammer	https://arstechnica.com/tech-policy/2026/10/romance-scam-doc-super-scam-me-takes-viewers-deep-into-love-bombing-terrain/	Ars Technica	news	\n                    Ashley Belanger\n                	1	2026-10-17 16:09:48.203252	\N	0	10
44	The Complete Guide to Voice AI Security and Privacy	https://dev.to/voice_developer/the-complete-guide-to-voice-ai-security-and-privacy-6ij	Dev.to	news	VoiceDeveloper	1	2026-10-17 16:09:48.313765	\N	0	10
45	Mark Wahlberg on using AI in film ‘the right way’ and being open to an AI clone carrying on his legacy	https://techcrunch.com/2026/10/16/mark-wahlberg-on-using-ai-in-film-the-right-way-and-being-open-to-an-ai-clone-carrying-on-his-legacy/	TechCrunch	news	Aisha Malik	1	2026-10-17 16:09:48.427493	\N	0	10
46	The Surface Laptop Ultra delivers on most of Microsoft's promises	https://arstechnica.com/reviews/2026/10/the-surface-laptop-ultra-delivers-on-most-of-microsofts-promises/	Ars Technica	news	\n                    Nick Indge\n                	1	2026-10-17 16:09:48.53515	\N	0	10
47	Veritas expands its anti-counterfeit chip to jewelry, trophies, and fragrance bottles	https://techcrunch.com/2026/10/16/veritas-is-building-a-chip-to-verify-luxury-goods/	TechCrunch	news	Ivan Mehta	1	2026-10-17 16:09:48.65121	\N	0	10
48	Rocket Report: FAA eyes more Starbase traffic; India's Skyroot snares US customer	https://arstechnica.com/space/2026/10/rocket-report-faa-eyes-more-starbase-traffic-indias-skyroot-snares-us-customer/	Ars Technica	news	\n                    Stephen Clark\n                	1	2026-10-17 16:09:48.759439	\N	0	10
49	Replit’s CEO says the future of work is the ‘self-driving company’	https://techcrunch.com/2026/10/16/replits-ceo-says-the-future-of-work-is-the-self-driving-company/	TechCrunch	news	Sarah Perez	1	2026-10-17 16:09:48.871121	\N	0	10
50	Blue Origin is going all in on the New Glenn rocket	https://arstechnica.com/space/2026/10/blue-origin-is-going-all-in-on-the-new-glenn-rocket/	Ars Technica	news	\n                    Eric Berger\n                	1	2026-10-17 16:09:48.981379	\N	0	10
51	Even Benchmark thinks AI is eroding the venture pact against backing rivals	https://techcrunch.com/2026/10/15/even-benchmark-thinks-ai-is-eroding-the-venture-pact-against-backing-rivals/	TechCrunch	news	Connie Loizos	1	2026-10-17 16:09:49.094615	\N	0	10
52	Googlebook review: Android on a laptop is still Android	https://arstechnica.com/reviews/2026/10/googlebook-review-android-on-a-laptop-is-still-android/	Ars Technica	news	\n                    Ryan Whitwam\n                	1	2026-10-17 16:09:49.201876	\N	0	10
53	Tesla reveals SpaceX-powered Roadster that flies and falls with style	https://techcrunch.com/2026/10/15/tesla-reveals-spacex-powered-roadster-that-flies-and-falls-with-style/	TechCrunch	news	Sean O'Kane	1	2026-10-17 16:09:49.318397	\N	0	10
54	KDE turns 30 with Plasma 6.8, remote upgrades, and an X11 farewell	https://arstechnica.com/gadgets/2026/10/kde-turns-30-with-plasma-6-8-remote-upgrades-and-an-x11-farewell/	Ars Technica	news	\n                    Nick Indge\n                	1	2026-10-17 16:09:49.426629	\N	0	10
55	When it came to Cal AI’s viral success, a small army of influencers paid off	https://techcrunch.com/2026/10/15/when-it-came-to-cal-ais-viral-success-a-small-army-of-influencers-paid-off/	TechCrunch	news	Lucas Ropek	1	2026-10-17 16:09:49.539418	\N	0	10
56	Plex now helps sell movie theater tickets	https://arstechnica.com/gadgets/2026/10/plex-now-helps-sell-movie-theater-tickets/	Ars Technica	news	\n                    Scharon Harding\n                	1	2026-10-17 16:09:49.650715	\N	0	10
57	And the winner of Startup Battlefield at Disrupt 2026 is: Intero Biosystems	https://techcrunch.com/2026/10/15/and-the-winner-of-startup-battlefield-at-disrupt-2026-is-intero-biosystems/	TechCrunch	news	Sean O'Kane	1	2026-10-17 16:09:49.767577	\N	0	10
58	Hegseth’s dubious low-T screening may flag up to 25 percent of the Army	https://arstechnica.com/health/2026/10/hegseths-dubious-low-t-screening-may-flag-up-to-25-percent-of-the-army/	Ars Technica	news	\n                    Beth Mole\n                	1	2026-10-17 16:09:49.875477	\N	0	10
59	Amazon devices chief Panos Panay on the importance of failure and bouncing back from it 	https://techcrunch.com/2026/10/15/amazon-devices-chief-panos-panay-on-the-importance-of-failure-and-bouncing-back-from-it/	TechCrunch	news	Aisha Malik	1	2026-10-17 16:09:49.988005	\N	0	10
60	Targeted ads delivered 0-click exploits to install mercenary malware	https://arstechnica.com/security/2026/10/targeted-ads-delivered-0-click-exploits-to-install-mercenary-malware/	Ars Technica	news	\n                    Dan Goodin\n                	1	2026-10-17 16:09:50.098714	\N	0	10
61	Meta launches an open-weight AI model that runs on Macs	https://techcrunch.com/2026/10/15/meta-launches-an-open-weight-model-that-runs-on-macs/	TechCrunch	news	Lucas Ropek	1	2026-10-17 16:09:50.210838	\N	0	10
62	Above the 911? Porsche previews a new mid-engined supercar.	https://arstechnica.com/cars/2026/10/porsche-previews-its-future-with-mission-s-supercar-concept/	Ars Technica	news	\n                    Jonathan M. Gitlin\n                	1	2026-10-17 16:09:50.320019	\N	0	10
63	Resume Advice Thread - October 17, 2026	https://www.reddit.com/r/cscareerquestions/comments/1x83kcj/resume_advice_thread_october_17_2026/	Reddit CS Career	ask	/u/CSCQMods	1	2026-10-17 16:09:57.943472	\N	0	10
64	[OFFICIAL] Salary Sharing thread for NEW GRADS :: September, 2026	https://www.reddit.com/r/cscareerquestions/comments/1whptxd/official_salary_sharing_thread_for_new_grads/	Reddit CS Career	ask	/u/CSCQMods	1	2026-10-17 16:09:58.270138	\N	0	10
65	Got laid off by AI (who could've thought)	https://www.reddit.com/r/cscareerquestions/comments/1x82tzd/got_laid_off_by_ai_who_couldve_thought/	Reddit CS Career	ask	/u/NerdStone04	1	2026-10-17 16:09:58.378375	\N	0	10
66	Tired working with unqualified colleagues, at the same time a lot of good candidates out there can't get hired	https://www.reddit.com/r/cscareerquestions/comments/1x7xplx/tired_working_with_unqualified_colleagues_at_the/	Reddit CS Career	ask	/u/Witty_Match9409	1	2026-10-17 16:09:58.486557	\N	0	10
67	What’s up with brilliant techies being flat broke	https://www.reddit.com/r/cscareerquestions/comments/1x7q98x/whats_up_with_brilliant_techies_being_flat_broke/	Reddit CS Career	ask	/u/whitecoathousing	1	2026-10-17 16:09:58.596289	\N	0	10
68	is the market cooked or is it flooded with mid people	https://www.reddit.com/r/cscareerquestions/comments/1x7hnn2/is_the_market_cooked_or_is_it_flooded_with_mid/	Reddit CS Career	ask	/u/SliceAndDime	1	2026-10-17 16:09:58.702623	\N	0	10
69	Are you behind if you don't use AI?	https://www.reddit.com/r/cscareerquestions/comments/1x87bav/are_you_behind_if_you_dont_use_ai/	Reddit CS Career	ask	/u/Keremvona	1	2026-10-17 16:09:58.810332	\N	0	10
70	Applying for a job makes me feel so bad	https://www.reddit.com/r/cscareerquestions/comments/1x8btvu/applying_for_a_job_makes_me_feel_so_bad/	Reddit CS Career	ask	/u/NatSpaghettiAgency	1	2026-10-17 16:09:58.919848	\N	0	10
71	My company's internal AI buildout is a disaster. Is this happening with anyone else?	https://www.reddit.com/r/cscareerquestions/comments/1x7pe34/my_companys_internal_ai_buildout_is_a_disaster_is/	Reddit CS Career	ask	/u/WhatNazisAreLike	1	2026-10-17 16:09:59.028803	\N	0	10
72	I'm so fucking tired of corporate bullshit getting in the way of actual engineering	https://www.reddit.com/r/cscareerquestions/comments/1x7b1p6/im_so_fucking_tired_of_corporate_bullshit_getting/	Reddit CS Career	ask	/u/Cautious-Control-419	1	2026-10-17 16:09:59.136964	\N	0	10
73	What do you think of the new implied Canadian dev salary roof?	https://www.reddit.com/r/cscareerquestions/comments/1x7ntm2/what_do_you_think_of_the_new_implied_canadian_dev/	Reddit CS Career	ask	/u/TemplateRedditor	1	2026-10-17 16:09:59.244597	\N	0	10
74	As a completely mid almost-graduate, I don't know what to make of AI	https://www.reddit.com/r/cscareerquestions/comments/1x829py/as_a_completely_mid_almostgraduate_i_dont_know/	Reddit CS Career	ask	/u/Sad_Scarcity1246	1	2026-10-17 16:09:59.35187	\N	0	10
75	"[rejection reason] + Please keep in touch and apply for future positions!"	https://www.reddit.com/r/cscareerquestions/comments/1x8dunz/rejection_reason_please_keep_in_touch_and_apply/	Reddit CS Career	ask	/u/adventurrr	1	2026-10-17 16:09:59.460342	\N	0	10
76	does UBC cs (university of british columbia) in canada have any recognition in the US?l	https://www.reddit.com/r/cscareerquestions/comments/1x8dbif/does_ubc_cs_university_of_british_columbia_in/	Reddit CS Career	ask	/u/Inevitable_gradient6	1	2026-10-17 16:09:59.569564	\N	0	10
77	Am I losing it, or is this pre-call take-home assignment completely unhinged?	https://www.reddit.com/r/cscareerquestions/comments/1x7lvvb/am_i_losing_it_or_is_this_precall_takehome/	Reddit CS Career	ask	/u/sberlinches	1	2026-10-17 16:09:59.678326	\N	0	10
78	Forward Deployed Engineers - are you enjoying the role?	https://www.reddit.com/r/cscareerquestions/comments/1x86xpc/forward_deployed_engineers_are_you_enjoying_the/	Reddit CS Career	ask	/u/skyloather123	1	2026-10-17 16:09:59.786548	\N	0	10
79	Is it worth doing a PhD anymore?	https://www.reddit.com/r/cscareerquestions/comments/1x8deas/is_it_worth_doing_a_phd_anymore/	Reddit CS Career	ask	/u/blazing_cannon	1	2026-10-17 16:09:59.895264	\N	0	10
80	If AI makes us so much more productive, why is everyone scared instead of making bigger plans?	https://www.reddit.com/r/cscareerquestions/comments/1x7bfiy/if_ai_makes_us_so_much_more_productive_why_is/	Reddit CS Career	ask	/u/askaccDude	1	2026-10-17 16:10:00.004156	\N	0	10
81	Need help deciding btw two offers	https://www.reddit.com/r/cscareerquestions/comments/1x7pgpb/need_help_deciding_btw_two_offers/	Reddit CS Career	ask	/u/FearlessFisherman333	1	2026-10-17 16:10:00.113136	\N	0	10
82	Career advise for a "DevOps Engineer" - what to do next?	https://www.reddit.com/r/cscareerquestions/comments/1x83ir8/career_advise_for_a_devops_engineer_what_to_do/	Reddit CS Career	ask	/u/coffeetocommands	1	2026-10-17 16:10:00.221478	\N	0	10
83	12 YOE, taking a career break after being asked to cut my pay	https://www.reddit.com/r/cscareerquestions/comments/1x7m0tx/12_yoe_taking_a_career_break_after_being_asked_to/	Reddit CS Career	ask	/u/dsanchezm	1	2026-10-17 16:10:00.329157	\N	0	10
84	How do I know intentions of my company when it comes to AI coding	https://www.reddit.com/r/cscareerquestions/comments/1x81xxt/how_do_i_know_intentions_of_my_company_when_it/	Reddit CS Career	ask	/u/PedanticProgarmer	1	2026-10-17 16:10:00.438587	\N	0	10
85	Since it's friday, I'm Gen Z 20yo and wanna know life during DotCom era in around 90's - 20's vs Today AI era. For Gen X and older gen redditors, which era do you prefer from coding perspective, both in terms of learning and careerwise?	https://www.reddit.com/r/cscareerquestions/comments/1x7n3l2/since_its_friday_im_gen_z_20yo_and_wanna_know/	Reddit CS Career	ask	/u/YouAreMyFire00	1	2026-10-17 16:10:00.547849	\N	0	10
86	How did you move on after getting rejected from a potentially life-changing job?	https://www.reddit.com/r/cscareerquestions/comments/1x7h1qd/how_did_you_move_on_after_getting_rejected_from_a/	Reddit CS Career	ask	/u/Efficient-Promise890	1	2026-10-17 16:10:00.656219	\N	0	10
87	Has anyone done an East to West coast move?	https://www.reddit.com/r/cscareerquestions/comments/1x7hn4f/has_anyone_done_an_east_to_west_coast_move/	Reddit CS Career	ask	/u/SomberDreamer	1	2026-10-17 16:10:00.763658	\N	0	10
89	The DelightQL Query Language	https://delightql.org	Lobsters Show	show	delightql.org by reverendpaco	1	2026-10-17 16:10:09.146624	\N	0	10
90	Earnote	https://www.producthunt.com/products/earnote	Product Hunt	show	Louis Klinke	1	2026-10-17 16:10:09.256429	\N	0	10
91	Easylang: A Simple, Browser-Based Programming Language in the Spirit of the Old Home Computer BASIC	https://easylang.online/ide	Lobsters Show	show	easylang.online by chkas	1	2026-10-17 16:10:09.359809	\N	0	10
92	NitroStack	https://www.producthunt.com/products/nitrostack	Product Hunt	show	Ben Lang	1	2026-10-17 16:10:09.472003	\N	0	10
93	Thrive: free, open-source game about the evolution of life	https://www.revolutionarygamesstudio.com/index	Lobsters Show	show	revolutionarygamesstudio.com via confusedalex	1	2026-10-17 16:10:09.576153	\N	0	10
94	Ultracite v8	https://www.producthunt.com/products/ultracite	Product Hunt	show	fmerian	1	2026-10-17 16:10:09.688998	\N	0	10
95	json2dir: Directory archives, made human-readable	https://github.com/alurm/json2dir	Lobsters Show	show	github.com via alurm	1	2026-10-17 16:10:09.792701	\N	0	10
96	Train with Pasta	https://www.producthunt.com/products/train-with-pasta	Product Hunt	show	Tim Shim	1	2026-10-17 16:10:09.904193	\N	0	10
97	Pared - remove unwanted Apple Intelligence models without disabling SIP	https://github.com/4evy/pared	Lobsters Show	show	github.com by FlameFlag	1	2026-10-17 16:10:10.007838	\N	0	10
98	CrewTower Mod for Claude Code	https://www.producthunt.com/products/crew-tower	Product Hunt	show	Said Altan	1	2026-10-17 16:10:10.116992	\N	0	10
99	Brut, the Brutal Router for Unix Tools	https://brut.sh	Lobsters Show	show	brut.sh by sstephenson	1	2026-10-17 16:10:10.221726	\N	0	10
100	Notion: Context for your agents	https://www.producthunt.com/products/notion	Product Hunt	show	Kate Ramakaieva	1	2026-10-17 16:10:10.33101	\N	0	10
101	outis: Fight AI spam by generating and sending a fake "user unknown" bounce emails	https://github.com/dtonon/outis	Lobsters Show	show	github.com by daniele	1	2026-10-17 16:10:10.438456	\N	0	10
102	Step 5 Preview	https://www.producthunt.com/products/step-3-5-flash	Product Hunt	show	Zac Zuo	1	2026-10-17 16:10:10.547415	\N	0	10
103	ASM Bots: Core War in real 8086 machine code	https://asmbots.io	Lobsters Show	show	asmbots.io by sirbrightool	1	2026-10-17 16:10:10.653657	\N	0	10
104	Unfenced	https://www.producthunt.com/products/unfenced	Product Hunt	show	David Clayton	1	2026-10-17 16:10:10.763007	\N	0	10
105	The Shell & Email	https://www.machtiani.chat/blogs/the-shell	Lobsters Show	show	machtiani.chat by abstract777	1	2026-10-17 16:10:10.868099	\N	0	10
106	LooGo	https://www.producthunt.com/products/loogo	Product Hunt	show	Jakub Pavlů	1	2026-10-17 16:10:10.976903	\N	0	10
107	weave: structural merging for different languages	https://github.com/Ataraxy-Labs/weave	Lobsters Show	show	github.com by rs545837	1	2026-10-17 16:10:11.080249	\N	0	10
108	Parrot	https://www.producthunt.com/products/parrot-10	Product Hunt	show	Uygar Turantekin	1	2026-10-17 16:10:11.19261	\N	0	10
109	Jev-powered autocorrection	https://levmiseri.com/nospace	Lobsters Show	show	levmiseri.com by wherewhy	1	2026-10-17 16:10:11.295879	\N	0	10
110	Emochi	https://www.producthunt.com/products/emochi-2	Product Hunt	show	Nick Zieber	1	2026-10-17 16:10:11.408125	\N	0	10
111	Running an Optimal Trace	https://anishathalye.com/optimal-trace/	Lobsters Show	show	anishathalye.com by anishathalye	1	2026-10-17 16:10:11.511035	\N	0	10
112	Spiralens	https://www.producthunt.com/products/spiralens	Product Hunt	show	Mehmet	1	2026-10-17 16:10:11.619152	\N	0	10
113	Squalk: an old-school forum engine built on Nostr (NIP-29 groups, NIP-7D threads)	https://github.com/dtonon/squalk	Lobsters Show	show	github.com by daniele	1	2026-10-17 16:10:11.725804	\N	0	10
114	GPU Terminal by Context.dev	https://www.producthunt.com/products/context-dev	Product Hunt	show	Ely	1	2026-10-17 16:10:11.835538	\N	0	10
115	txcript: Switching coding agents mid-conversation	https://github.com/skillsynchq/txcript	Lobsters Show	show	github.com by nishantjosh	1	2026-10-17 16:10:11.940373	\N	0	10
116	Draper	https://www.producthunt.com/products/draper	Product Hunt	show	Dexter Todd	1	2026-10-17 16:10:12.049228	\N	0	10
117	zopt: low-ceremony command line parsing for Zig	https://codeberg.org/hgrsd/zopt	Lobsters Show	show	codeberg.org by hgrsd	1	2026-10-17 16:10:12.15604	\N	0	10
118	Korinotch	https://www.producthunt.com/products/korinotch	Product Hunt	show	Aissa Ahlali	1	2026-10-17 16:10:12.26538	\N	0	10
119	An image only some users can see	https://d.erenrich.net/apple.avif	Lobsters Show	show	d.erenrich.net by derenrich	1	2026-10-17 16:10:12.36799	\N	0	10
120	Salience	https://www.producthunt.com/products/salience	Product Hunt	show	Carl Hendy	1	2026-10-17 16:10:12.478582	\N	0	10
121	deforester - Logging for Janet	https://codeberg.org/veqq/deforester	Lobsters Show	show	codeberg.org by veqq	1	2026-10-17 16:10:12.581824	\N	0	10
122	Caldera	https://www.producthunt.com/products/caldera	Product Hunt	show	Michael Jones	1	2026-10-17 16:10:12.695443	\N	0	10
123	Texttile, a multiplayer blog engine for people who write together	https://www.v01.io/posts/2026/08/texttile/	Lobsters Show	show	v01.io by klausbreyer	1	2026-10-17 16:10:12.799819	\N	0	10
124	Jockey by TwelveLabs	https://www.producthunt.com/products/twelvelabs	Product Hunt	show	fmerian	1	2026-10-17 16:10:12.912299	\N	0	10
125	Small and reasonably fast QOI decoder written in zig	https://github.com/sorvi-platform/dekoodaaja	Lobsters Show	show	github.com by Cloudef	1	2026-10-17 16:10:13.016733	\N	0	10
126	Nemotron 3.5 Super VL	https://www.producthunt.com/products/nvidia	Product Hunt	show	Kumar Abhishek	1	2026-10-17 16:10:13.129894	\N	0	10
127	maiao: Gerrit-style stacked diffs for GitHub, Cursor Origin, GitLab, Codeberg and more	https://github.com/runetes/maiao	Lobsters Show	show	github.com by joaoqalves	1	2026-10-17 16:10:13.232616	\N	0	10
128	Parallax	https://www.producthunt.com/products/parallax-5	Product Hunt	show	Loc Tran	1	2026-10-17 16:10:13.345355	\N	0	10
129	Routeup – stable local HTTPS URLs and opt-in public tunnels	https://routeup.dev	Lobsters Show	show	routeup.dev by mukul	1	2026-10-17 16:10:13.447435	\N	0	10
130	Firefox Enterprise	https://www.producthunt.com/products/mozilla	Product Hunt	show	Justin Jincaid	1	2026-10-17 16:10:13.556344	\N	0	10
131	nss-userhosts - hosts files for unprivileged users	https://codeberg.org/felixs/nss-userhosts	Lobsters Show	show	codeberg.org by felixs	1	2026-10-17 16:10:13.660823	\N	0	10
132	Lovable Growth Tools	https://www.producthunt.com/products/lovable	Product Hunt	show	Kate Ramakaieva	1	2026-10-17 16:10:13.769249	\N	0	10
133	capri: Type-safe, atomic Gleam bindings for Khepri, the modern distributed database for the BEAM	https://capri.hexdocs.pm/	Lobsters Show	show	capri.hexdocs.pm by reesericci	1	2026-10-17 16:10:13.875122	\N	0	10
134	Dottr	https://www.producthunt.com/products/dottr	Product Hunt	show	Kevin William David	1	2026-10-17 16:10:13.983532	\N	0	10
135	Tsampi BFT: Leaderless One-Round Voting with Parameterized Finality	https://www.tsampi.com/tsampi-bft-1.1.pdf	Lobsters Show	show	tsampi.com by readevalprint	1	2026-10-17 16:10:14.08665	\N	0	10
136	Memory Chess	https://www.producthunt.com/products/memory-chess	Product Hunt	show	Bing Cheng	1	2026-10-17 16:10:14.197565	\N	0	10
137	What do you think of LazyPromise as a lightweight alternative to Effect?	https://github.com/lazy-promise/lazy-promise	Lobsters Show	show	github.com by ivan7237d	1	2026-10-17 16:10:14.301036	\N	0	10
138	Fish Audio Drama 3	https://www.producthunt.com/products/fish-speech	Product Hunt	show	Justin Jincaid	1	2026-10-17 16:10:14.412905	\N	0	10
139	Hintly for Google Meet™	https://www.producthunt.com/products/hintly-for-google-meet	Product Hunt	show	Myster Violets	1	2026-10-17 16:10:14.516087	\N	0	10
140	Pomerado	https://www.producthunt.com/products/pomerado	Product Hunt	show	Garry Tan	1	2026-10-17 16:10:14.625146	\N	0	10
141	SignWith	https://www.producthunt.com/products/signwith	Product Hunt	show	Tibo	1	2026-10-17 16:10:14.728936	\N	0	10
142	Tesla Roadster	https://www.producthunt.com/products/tesla-roadster	Product Hunt	show	Zac Zuo	1	2026-10-17 16:10:14.838009	\N	0	10
143	Harness by Autonomous	https://www.producthunt.com/products/harness-by-autonomous	Product Hunt	show	Hiten Shah	1	2026-10-17 16:10:14.94375	\N	0	10
144	DOYT	https://www.producthunt.com/products/doyt	Product Hunt	show	Roa Lee	1	2026-10-17 16:10:15.052424	\N	0	10
145	Tetriz Harness	https://www.producthunt.com/products/tetriz-harness	Product Hunt	show	Prasanna R	1	2026-10-17 16:10:15.155886	\N	0	10
146	Maybloc	https://www.producthunt.com/products/maybloc	Product Hunt	show	Aayush R	1	2026-10-17 16:10:15.26715	\N	0	10
147	Grablo Spot	https://www.producthunt.com/products/grablo-spot	Product Hunt	show	YoungMin Kim	1	2026-10-17 16:10:15.370647	\N	0	10
148	Atelier	https://www.producthunt.com/products/atelier-9	Product Hunt	show	Abdalmohsen Al Tulaihi	1	2026-10-17 16:10:15.482997	\N	0	10
149	Nudgebox	https://www.producthunt.com/products/nudgebox	Product Hunt	show	Eduardo Serrano	1	2026-10-17 16:10:15.586256	\N	0	10
150	Calenteri	https://www.producthunt.com/products/calenteri	Product Hunt	show	Aleksi Suoknuuti	1	2026-10-17 16:10:15.697603	\N	0	10
151	Scalebrowser	https://www.producthunt.com/products/scalebrowser	Product Hunt	show	Davide G.	1	2026-10-17 16:10:15.800586	\N	0	10
152	Neophyte	https://www.producthunt.com/products/neophyte	Product Hunt	show	Christian Ruink	1	2026-10-17 16:10:15.910443	\N	0	10
153	Mermaid	https://www.producthunt.com/products/mermaid	Product Hunt	show	Abhusan Shrestha	1	2026-10-17 16:10:16.015792	\N	0	10
154	Skisso	https://www.producthunt.com/products/skisso-design-on-the-live-product	Product Hunt	show	Alexander Zakabluk	1	2026-10-17 16:10:16.125575	\N	0	10
155	FinderGit	https://www.producthunt.com/products/findergit	Product Hunt	show	Giovambattista Fazioli	1	2026-10-17 16:10:16.241604	\N	0	10
156	Tidy Design	https://www.producthunt.com/products/tidy-design	Product Hunt	show	Tadhg	1	2026-10-17 16:10:16.351779	\N	0	10
157	NANI???	https://www.producthunt.com/products/nani-2	Product Hunt	show	Julius Bryan Reynon Gambe	1	2026-10-17 16:10:16.454771	\N	0	10
158	BOSS Console	https://www.producthunt.com/products/boss-console	Product Hunt	show	Nilesh Vasita	1	2026-10-17 16:10:16.567139	\N	0	10
159	Helicon	https://www.producthunt.com/products/helicon	Product Hunt	show	Harjot Singh Rana	1	2026-10-17 16:10:16.669752	\N	0	10
160	Holm	https://www.producthunt.com/products/holm	Product Hunt	show	Manish	1	2026-10-17 16:10:16.788368	\N	0	10
161	Muse Spark Open	https://www.producthunt.com/products/muse-spark-open	Product Hunt	show	KP	1	2026-10-17 16:10:16.8918	\N	0	10
162	Taim	https://www.producthunt.com/products/taim-4	Product Hunt	show	Sofia Pavlidou	1	2026-10-17 16:10:17.002448	\N	0	10
163	Mixpanel: Customer Value Architect III	https://weworkremotely.com/remote-jobs/mixpanel-customer-value-architect-iii-1	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:22.697607	\N	0	10
164	Mixpanel: Customer Value Architect III	https://weworkremotely.com/remote-jobs/mixpanel-customer-value-architect-iii	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:23.012353	\N	0	10
165	Sanctuary Computer: Head of Technology	https://weworkremotely.com/remote-jobs/sanctuary-computer-head-of-technology	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:23.1159	\N	0	10
166	Maven Clinic: Director, Marketing Operations	https://weworkremotely.com/remote-jobs/maven-clinic-director-marketing-operations	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:23.220356	\N	0	10
167	Maven Clinic: Care Coach	https://weworkremotely.com/remote-jobs/maven-clinic-care-coach	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:23.325908	\N	0	10
168	Fivetran : Global Alliance Lead, Capgemini	https://weworkremotely.com/remote-jobs/fivetran-global-alliance-lead-capgemini	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:23.431933	\N	0	10
169	Askable: Software Engineer, AI Coding Tasks (Contract) 	https://weworkremotely.com/remote-jobs/askable-software-engineer-ai-coding-tasks-contract	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:23.534553	\N	0	10
170	Medify: Engineering Manager	https://weworkremotely.com/remote-jobs/medify-engineering-manager	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:23.640426	\N	0	10
171	Lattice: Senior Software Engineer, Infrastructure Platform	https://weworkremotely.com/remote-jobs/lattice-senior-software-engineer-infrastructure-platform	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:23.746565	\N	0	10
172	StockX: Category Manager - Apparel	https://weworkremotely.com/remote-jobs/stockx-category-manager-apparel	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:23.850703	\N	0	10
173	Databricks: Deployment Strategist	https://weworkremotely.com/remote-jobs/databricks-deployment-strategist	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:23.954037	\N	0	10
174	Coinbase: Analyst, Privacy (Privacy Assessments)	https://weworkremotely.com/remote-jobs/coinbase-analyst-privacy-privacy-assessments	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:24.057831	\N	0	10
175	Melio: Senior Talent Acquisition Partner (Contract)	https://weworkremotely.com/remote-jobs/melio-senior-talent-acquisition-partner-contract	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:24.164094	\N	0	10
176	Toptal: Applied AI Engineers for telecommunications company	https://weworkremotely.com/remote-jobs/toptal-applied-ai-engineers-for-telecommunications-company	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:24.269785	\N	0	10
177	Toptal: Apigee Engineer for Global Consumer Food Company	https://weworkremotely.com/remote-jobs/toptal-apigee-engineer-for-global-consumer-food-company	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:24.372099	\N	0	10
244	Built a Local AI Code Reviewer with Ollama | Private & Open Source 🚀	https://dev.to/abhisekroy169/built-a-local-ai-code-reviewer-with-ollama-private-open-source-237b	Dev.to	news	Abhisek Roy	1	2026-10-22 08:17:01.279178	\N	0	10
178	Toptal: Salesforce Developers with AI-Assisted Coding Experience	https://weworkremotely.com/remote-jobs/toptal-salesforce-developers-with-ai-assisted-coding-experience	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:24.486274	\N	0	10
179	Toptal: Full-Stack E-commerce Developer with Sage X3 Experience	https://weworkremotely.com/remote-jobs/toptal-full-stack-e-commerce-developer-with-sage-x3-experience	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:24.588733	\N	0	10
180	Vercel: Software Engineer - Data Platform	https://weworkremotely.com/remote-jobs/vercel-software-engineer-data-platform	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:24.693183	\N	0	10
181	Vercel: Software Engineer, Backend	https://weworkremotely.com/remote-jobs/vercel-software-engineer-backend	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:24.798069	\N	0	10
182	Maven Clinic: Client Success Manager	https://weworkremotely.com/remote-jobs/maven-clinic-client-success-manager	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:24.902163	\N	0	10
183	Typeform: Full Stack Developer	https://weworkremotely.com/remote-jobs/typeform-full-stack-developer	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:25.004984	\N	0	10
184	Jumio: Machine Learning Engineer - IV (Computer Vision)	https://weworkremotely.com/remote-jobs/jumio-machine-learning-engineer-iv-computer-vision	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:25.10911	\N	0	10
185	Lemon.io: Senior React Full-stack Developer	https://weworkremotely.com/remote-jobs/lemon-io-senior-react-full-stack-developer-7	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:25.215615	\N	0	10
186	Lemon.io: Senior .NET Full-stack Developer	https://weworkremotely.com/remote-jobs/lemon-io-senior-net-full-stack-developer-2	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:25.325643	\N	0	10
187	Jumio: Machine Learning Engineer - IV (Biometrics)	https://weworkremotely.com/remote-jobs/jumio-machine-learning-engineer-iv-biometrics	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:25.43073	\N	0	10
188	Jumio: Machine Learning Engineer	https://weworkremotely.com/remote-jobs/jumio-machine-learning-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:25.541968	\N	0	10
189	Abnormal: Director of Security Engineering	https://weworkremotely.com/remote-jobs/abnormal-director-of-security-engineering	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:25.666077	\N	0	10
190	Coinbase: Analyst, Privacy	https://weworkremotely.com/remote-jobs/coinbase-analyst-privacy	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:25.785767	\N	0	10
191	Dremio: Software Engineer - Query Execution	https://weworkremotely.com/remote-jobs/dremio-software-engineer-query-execution	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:25.893307	\N	0	10
192	Lemon.io: Senior Angular Full-stack Developer	https://weworkremotely.com/remote-jobs/lemon-io-senior-angular-full-stack-developer	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:26.002128	\N	0	10
193	PagerDuty: Senior Director, Field Enablement	https://weworkremotely.com/remote-jobs/pagerduty-senior-director-field-enablement	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:26.106992	\N	0	10
194	Webflow: Senior Infrastructure Engineer	https://weworkremotely.com/remote-jobs/webflow-senior-infrastructure-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:26.211418	\N	0	10
195	LaunchDarkly: Backend Engineer (Multiple Positions)	https://weworkremotely.com/remote-jobs/launchdarkly-backend-engineer-multiple-positions	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:26.322006	\N	0	10
196	Wrike: Director, Global GTM Strategy & Operations	https://weworkremotely.com/remote-jobs/wrike-director-global-gtm-strategy-operations	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:26.427798	\N	0	10
197	Stripe: Abuse Research Engineer	https://weworkremotely.com/remote-jobs/stripe-abuse-research-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:26.535401	\N	0	10
198	Doximity: Commercial Data Scientist	https://weworkremotely.com/remote-jobs/doximity-commercial-data-scientist	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:26.640535	\N	0	10
199	Hex Technologies: Legal Ops	https://weworkremotely.com/remote-jobs/hex-technologies-legal-ops	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:26.743841	\N	0	10
200	Lithic: Senior Risk Associate	https://weworkremotely.com/remote-jobs/lithic-senior-risk-associate	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:26.851362	\N	0	10
201	Salesloft: Principal Software Engineer, AI	https://weworkremotely.com/remote-jobs/salesloft-principal-software-engineer-ai	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:26.956226	\N	0	10
202	Tailscale: Analytics Engineer, Data	https://weworkremotely.com/remote-jobs/tailscale-analytics-engineer-data	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:27.061007	\N	0	10
203	Tailscale: Analytics Engineer, Data	https://weworkremotely.com/remote-jobs/tailscale-analytics-engineer-data	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:27.169163	\N	0	10
204	Lithic: Senior Software Engineer, Card Authorization	https://weworkremotely.com/remote-jobs/lithic-senior-software-engineer-card-authorization	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:27.274835	\N	0	10
205	Discord: Engineering Manager, Machine Learning (Safety)	https://weworkremotely.com/remote-jobs/discord-engineering-manager-machine-learning-safety	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:27.378389	\N	0	10
206	ZoomInfo Technologies LLC: Director, Applied AI	https://weworkremotely.com/remote-jobs/zoominfo-technologies-llc-director-applied-ai	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:27.486273	\N	0	10
207	Postscript: Client Strategist	https://weworkremotely.com/remote-jobs/postscript-client-strategist	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:27.590178	\N	0	10
208	Dremio: Software Engineer - Developer Experience	https://weworkremotely.com/remote-jobs/dremio-software-engineer-developer-experience	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:27.696155	\N	0	10
209	Dremio: Senior Staff Software Engineer - Query Execution	https://weworkremotely.com/remote-jobs/dremio-senior-staff-software-engineer-query-execution	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:27.802357	\N	0	10
210	Toptal: Salesforce Platform Lead for Global Industrial Company	https://weworkremotely.com/remote-jobs/toptal-salesforce-platform-lead-for-global-industrial-company	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:27.9093	\N	0	10
211	STEUART NUTRITION: Software Developer AI Coding	https://weworkremotely.com/remote-jobs/steuart-nutrition-software-developer-ai-coding	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:28.012737	\N	0	10
212	Glean: Application Security Engineer	https://weworkremotely.com/remote-jobs/glean-application-security-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:28.12011	\N	0	10
213	Adventure Travel 365: Senior Full-Stack Developer - Marketplace Web & Mobile Platform	https://weworkremotely.com/remote-jobs/adventure-travel-365-senior-full-stack-developer-marketplace-web-mobile-platform	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:28.224176	\N	0	10
214	Hex Technologies: Cloud Security Engineer	https://weworkremotely.com/remote-jobs/hex-technologies-cloud-security-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:28.328844	\N	0	10
215	Toptal: Senior Integration Engineer for Enterprise API & Integration Products	https://weworkremotely.com/remote-jobs/toptal-senior-integration-engineer-for-enterprise-api-integration-products	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:28.432015	\N	0	10
216	Sticker Mule: SI agent engineer	https://weworkremotely.com/remote-jobs/sticker-mule-si-agent-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:28.53997	\N	0	10
217	Toggl: Senior Full Stack	https://weworkremotely.com/remote-jobs/toggl-senior-full-stack	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:28.642334	\N	0	10
218	Samsara: Staff Software Engineer	https://weworkremotely.com/remote-jobs/samsara-staff-software-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:28.747166	\N	0	10
219	Yooli: FULL TIME: Software Engineer Position - React and Rest	https://weworkremotely.com/remote-jobs/yooli-full-time-software-engineer-position-react-and-rest-1	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:28.849359	\N	0	10
220	Sticker Mule: Software engineer	https://weworkremotely.com/remote-jobs/sticker-mule-software-engineer-3	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:28.957393	\N	0	10
221	A.Team: Senior Independent AI Engineer / Architect	https://weworkremotely.com/remote-jobs/a-team-senior-independent-ai-engineer-architect	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:29.059688	\N	0	10
222	A.Team: Senior Independent Software Developer ($90-$170/hr)	https://weworkremotely.com/remote-jobs/a-team-senior-independent-software-developer-90-170-hr	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:29.165167	\N	0	10
223	Storetasker: Senior Shopify Developer (Remote + Flexible)	https://weworkremotely.com/remote-jobs/storetasker-senior-shopify-developer-remote-flexible-3	We Work Remotely	jobs	We Work Remotely	1	2026-10-17 16:10:29.270703	\N	0	10
224	Why Prompt Filters Don't Protect Autonomous Agents	https://dev.to/matteo_tartaglia_5d97f9b2/why-prompt-filters-dont-protect-autonomous-agents-4pid	Dev.to	news	Matteo Tartaglia	1	2026-10-22 08:16:58.284519	\N	0	10
225	Tesla says it will start selling Cybercabs by end of year	https://techcrunch.com/2026/10/21/tesla-says-it-will-start-selling-cybercabs-by-end-of-year/	TechCrunch	news	Kirsten Korosec	1	2026-10-22 08:16:58.718928	\N	0	10
226	YouTube says it isn’t testing hiding the dislike button	https://www.theverge.com/streaming/1016206/youtube-dislike-button-videos	The Verge	news	Jay Peters	1	2026-10-22 08:16:58.857141	\N	0	10
227	FCC chair warns media not to run the "fake polls" Trump keeps complaining about	https://arstechnica.com/tech-policy/2026/10/fcc-chair-warns-media-not-to-run-the-fake-polls-trump-keeps-complaining-about/	Ars Technica	news	\n                    Jon Brodkin\n                	1	2026-10-22 08:16:58.997683	\N	0	10
228	Making unchanged pixels transparent made my GIF 25% bigger	https://dev.to/token111/making-unchanged-pixels-transparent-made-my-gif-25-bigger-5d8b	Dev.to	news	yue xing	1	2026-10-22 08:16:59.137192	\N	0	10
229	Blackstone’s Jas Khaira says fears over AI-buildout debt are overblown	https://techcrunch.com/2026/10/21/blackstones-jas-khaira-says-fears-over-ai-buildout-debt-are-overblown/	TechCrunch	news	Marina Temkin	1	2026-10-22 08:16:59.267637	\N	0	10
230	Tesla says customers can add their own vehicles to the robotaxi fleet next year — will it happen?	https://www.theverge.com/transportation/1016118/tesla-robotaxi-customer-owned-vehicle-fleet-network-q3-2026-earnings	The Verge	news	Andrew J. Hawkins	1	2026-10-22 08:16:59.40148	\N	0	10
231	Xbox wants you to pay 24 to 40 cents per hour to stream games you already bought	https://arstechnica.com/gaming/2026/10/xbox-wants-you-to-pay-24-to-40-cents-per-hour-to-stream-games-you-already-bought/	Ars Technica	news	\n                    Kyle Orland\n                	1	2026-10-22 08:16:59.547685	\N	0	10
232	SlothPlan AI: Let a Robotic Sloth Untangle Your To-Do List	https://dev.to/charan_romi_4645cad7b74f8/slothplan-ai-let-a-robotic-sloth-untangle-your-to-do-list-9d1	Dev.to	news	Charan Romi	1	2026-10-22 08:16:59.679137	\N	0	10
233	Meta wants to pay for its broad AI buildout with a newly created class of stock	https://techcrunch.com/2026/10/21/meta-wants-to-pay-for-its-broad-ai-buildout-with-a-newly-created-class-of-stock/	TechCrunch	news	Lucas Ropek	1	2026-10-22 08:16:59.807692	\N	0	10
234	Data centers could erase decades of air quality gains	https://www.theverge.com/ai-artificial-intelligence/1015958/data-center-pollution-rising-report	The Verge	news	Justine Calma	1	2026-10-22 08:16:59.934069	\N	0	10
235	Enterprises keep buying software upgrades that IT thinks will make things worse	https://arstechnica.com/information-technology/2026/10/survey-enterprises-waste-28-percent-of-software-budgets-on-unwanted-upgrades/	Ars Technica	news	\n                    Scharon Harding\n                	1	2026-10-22 08:17:00.070766	\N	0	10
236	Buffer Pool and Cache Management for Database Engines	https://dev.to/beefedai/buffer-pool-and-cache-management-for-database-engines-364l	Dev.to	news	beefed.ai	1	2026-10-22 08:17:00.201674	\N	0	10
237	Airbnb limits chores for guests, sparking backlash from hosts	https://techcrunch.com/2026/10/21/airbnb-limits-chores-for-guests-sparking-backlash-from-hosts/	TechCrunch	news	Lauren Forristal	1	2026-10-22 08:17:00.337559	\N	0	10
238	Meta to create a new class of shares to fund AI push	https://www.theverge.com/tech/1015799/meta-shares-class-ai-q3-2026-earnings	The Verge	news	Emma Roth	1	2026-10-22 08:17:00.472451	\N	0	10
239	Tesla profits drop 43% in Q3	https://arstechnica.com/cars/2026/10/tesla-profits-drop-43-in-q3/	Ars Technica	news	\n                    Jonathan M. Gitlin\n                	1	2026-10-22 08:17:00.602909	\N	0	10
240	毎日使う機能が、ひとつにつながる。macOS ターミナル「xtty」を作りました	https://dev.to/jian_xu_607a1d700c0b997a2/mei-ri-shi-uji-neng-ga-hitotunitunagaru-macos-taminaruxtty-wozuo-rimasita-1l6d	Dev.to	news	jian xu	1	2026-10-22 08:17:00.729204	\N	0	10
241	TechCrunch Founder Summit 2026: Everything you need to know 	https://techcrunch.com/2026/10/21/techcrunch-founder-summit-2026-everything-you-need-to-know/	TechCrunch	news	TechCrunch Events	1	2026-10-22 08:17:00.865711	\N	0	10
242	New York’s first microdrama film festival searches for its audience	https://www.theverge.com/entertainment/1014494/alza-vertical-film-festival-bill-block-salvador-paskowitz-microdramas-verticals	The Verge	news	Charles Pulliam-Moore	1	2026-10-22 08:17:01.002292	\N	0	10
243	The new human-crafted Apple Music brand matters in an AI world	https://arstechnica.com/culture/2026/10/the-new-human-crafted-apple-music-brand-matters-in-an-ai-world/	Ars Technica	news	\n                    Aurich Lawson\n                	1	2026-10-22 08:17:01.137695	\N	0	10
245	Meta says Muse has over 10M users, with shopping a top activity	https://techcrunch.com/2026/10/21/meta-says-muse-has-over-10m-users-with-shopping-a-top-activity/	TechCrunch	news	Sarah Perez	1	2026-10-22 08:17:01.413719	\N	0	10
246	Meta says it would’ve made over $22 billion if it didn’t have to pay a child safety settlement	https://www.theverge.com/tech/1015877/meta-q3-2026-earnings-child-safety-settlement	The Verge	news	Emma Roth	1	2026-10-22 08:17:01.559058	\N	0	10
247	RIP BioWare: EA shuts down storied RPG studio after over three decades	https://arstechnica.com/gaming/2026/10/rip-bioware-ea-shuts-down-storied-rpg-studio-after-over-three-decades/	Ars Technica	news	\n                    Kyle Orland\n                	1	2026-10-22 08:17:01.695718	\N	0	10
248	How to Calculate VAT in the UK: Adding and Removing VAT, Step by Step	https://dev.to/uk_vat_guide/how-to-calculate-vat-in-the-uk-adding-and-removing-vat-step-by-step-21ig	Dev.to	news	UK VAT Guide	1	2026-10-22 08:17:01.828293	\N	0	10
249	Year-old AI lab Flapping Airplanes raises $1B at a $6B valuation	https://techcrunch.com/2026/10/21/year-old-ai-lab-flapping-airplanes-raises-1b-at-a-6b-valuation/	TechCrunch	news	Julie Bort	1	2026-10-22 08:17:01.965592	\N	0	10
250	PHP: The three letters that shut down sites all over the internet today	https://www.theverge.com/tech/1015906/php2shell-vulnerability-october-2026	The Verge	news	Terrence O’Brien	1	2026-10-22 08:17:02.094364	\N	0	10
251	OpenAI's latest AI models are coming to Google Cloud and Antigravity	https://arstechnica.com/ai/2026/10/openais-latest-ai-models-are-coming-to-google-cloud-and-antigravity/	Ars Technica	news	\n                    Ryan Whitwam\n                	1	2026-10-22 08:17:02.227683	\N	0	10
252	My AI agents all stopped when the provider credit ran out. Here is the budget guard I added.	https://dev.to/renev3408/my-ai-agents-all-stopped-when-the-provider-credit-ran-out-here-is-the-5-line-stdlib-guard-i-added-j7k	Dev.to	news	rene	1	2026-10-22 08:17:02.367403	\N	0	10
253	Tesla starts Optimus robot production in California as profit falls 43%	https://techcrunch.com/2026/10/21/tesla-stars-optimus-robot-production-in-california-as-profit-falls-43/	TechCrunch	news	Kirsten Korosec, Sean O'Kane	1	2026-10-22 08:17:02.507841	\N	0	10
254	Flying Roadsters can’t lift Tesla’s flat Q3 revenues	https://www.theverge.com/transportation/1015790/tesla-q3-2026-earnings-revenue-profit-roadster-spacex-merger	The Verge	news	Andrew J. Hawkins	1	2026-10-22 08:17:02.639236	\N	0	10
255	Report: Musk ordered Starlink slowdown in Ukraine, then blamed it on Trump	https://arstechnica.com/tech-policy/2026/10/report-says-musk-not-trump-ordered-starlink-throttling-that-blindsided-ukraine/	Ars Technica	news	\n                    Jon Brodkin\n                	1	2026-10-22 08:17:02.767645	\N	0	10
256	Refunds are often where Shopify and QuickBooks integrations get complicated. Great point about testing these edge cases early, because catching them before they affect financial records can save a lot of cleanup later!	https://dev.to/elsie-rainee/refunds-are-often-where-shopify-and-quickbooks-integrations-get-complicated-great-point-about-4l8d	Dev.to	news	Elsie Rainee	1	2026-10-22 08:17:02.907205	\N	0	10
257	Recursive launches Flint, a laptop coding model it says was largely built by AI	https://techcrunch.com/2026/10/21/recursive-launches-flint-a-laptop-coding-model-it-says-was-largely-built-by-ai/	TechCrunch	news	Aditya Mehta	1	2026-10-22 08:17:03.033647	\N	0	10
258	Bose acquires Skullcandy to help it reach a wider audience	https://www.theverge.com/tech/1015276/bose-acquisition-skullcandy-headphones-earbuds-speakers	The Verge	news	Andrew Liszewski	1	2026-10-22 08:17:03.161376	\N	0	10
259	Judge rejects Trump’s wild claim EPA can dismiss data center pollution lawsuits	https://arstechnica.com/tech-policy/2026/10/judge-rejects-trumps-wild-claim-epa-can-dismiss-data-center-pollution-lawsuits/	Ars Technica	news	\n                    Ashley Belanger\n                	1	2026-10-22 08:17:03.293655	\N	0	10
260	Only 13% of the pixels moved, yet the GIF frames stored 74% of the canvas. Keep the moving parts together	https://dev.to/shu_jing_915fa287b22539ad/only-13-of-the-pixels-moved-yet-the-gif-frames-stored-74-of-the-canvas-keep-the-moving-parts-844	Dev.to	news	AsyncMonk	1	2026-10-22 08:17:03.417158	\N	0	10
261	Automattic begins layoffs following board upheaval and executive departures	https://techcrunch.com/2026/10/21/automattic-begins-layoffs-following-board-upheaval-and-executive-departures/	TechCrunch	news	Sarah Perez	1	2026-10-22 08:17:03.559784	\N	0	10
262	Airbnb bans making guests do dishes and take out the trash	https://www.theverge.com/tech/1015844/airbnb-chores-house-rules-update	The Verge	news	Stevie Bonifield	1	2026-10-22 08:17:03.691232	\N	0	10
263	Does opting out of smart TV tracking work? Research finds “suspicious” traffic.	https://arstechnica.com/gadgets/2026/10/does-opting-out-of-smart-tv-tracking-work-research-finds-suspicious-traffic/	Ars Technica	news	\n                    Scharon Harding\n                	1	2026-10-22 08:17:03.85276	\N	0	10
264	Disk Full on a Linux VPS? How to Find What Is Using the Space	https://dev.to/progineous/disk-full-on-a-linux-vps-how-to-find-what-is-using-the-space-305	Dev.to	news	Pro Gineous	1	2026-10-22 08:17:03.997136	\N	0	10
265	GM is betting compute and AI will help it compete with Chinese automakers	https://techcrunch.com/2026/10/21/gm-is-betting-compute-and-ai-will-help-it-compete-with-chinese-automakers/	TechCrunch	news	Tim De Chant, Kirsten Korosec	1	2026-10-22 08:17:04.12275	\N	0	10
266	SpaceX to attempt Starship catch on next flight, with eye on rapid cadence increase	https://arstechnica.com/space/2026/10/spacex-will-attempt-to-reach-weekly-starship-launches-by-early-2027/	Ars Technica	news	\n                    Eric Berger\n                	1	2026-10-22 08:17:04.257235	\N	0	10
267	Why Alan Wake 2 Bet on Northlight: The Stubborn Finnish Engine Behind Remedy's Horror Comeback	https://dev.to/wlz/why-alan-wake-2-bet-on-northlight-the-stubborn-finnish-engine-behind-remedys-horror-comeback-4agi	Dev.to	news	dev game	1	2026-10-22 08:17:04.392666	\N	0	10
268	Meta ordered to pay $25B in case related to Cambridge Analytica scandal	https://techcrunch.com/2026/10/21/meta-ordered-to-pay-25-billion-in-case-related-to-cambridge-analytica-scandal/	TechCrunch	news	Lucas Ropek	1	2026-10-22 08:17:04.533068	\N	0	10
269	The $15 billion ad-powered AI startup your doctor may already be using	https://arstechnica.com/ai/2026/10/the-15-billion-ad-powered-ai-startup-your-doctor-may-already-be-using/	Ars Technica	news	\n                    Rafe Rosner-Uddin, Financial Times\n                	1	2026-10-22 08:17:04.677663	\N	0	10
270	While Amazon blocks AI agents, Walmart rolls out the welcome mat	https://techcrunch.com/2026/10/21/while-amazon-blocks-ai-agents-walmart-rolls-out-the-welcome-mat/	TechCrunch	news	Sarah Perez	1	2026-10-22 08:17:04.804127	\N	0	10
271	Review: Carrie is a triumphant remix with one major flaw	https://arstechnica.com/culture/2026/10/review-carrie-is-a-triumphant-remix-with-one-major-flaw/	Ars Technica	news	\n                    Jennifer Ouellette\n                	1	2026-10-22 08:17:04.943627	\N	0	10
272	The internet is having a very bad cybersecurity day	https://techcrunch.com/2026/10/21/the-internet-is-having-a-very-bad-cybersecurity-day/	TechCrunch	news	Sarah Perez	1	2026-10-22 08:17:05.081269	\N	0	10
273	The past, present, and future share a show floor at Pinball Expo 2026	https://arstechnica.com/gaming/2026/10/the-past-present-and-future-share-a-show-floor-at-pinball-expo-2026/	Ars Technica	news	\n                    Nick Indge\n                	1	2026-10-22 08:17:05.215689	\N	0	10
274	Legal AI startup Legora raises $550M Series E at $8.8B valuation	https://techcrunch.com/2026/10/21/legal-ai-startup-legora-raises-550m-series-e-at-8-8b-valuation/	TechCrunch	news	Dominic-Madori Davis	1	2026-10-22 08:17:05.345225	\N	0	10
275	PHP warns it plans to release 2 emergency patches imminently	https://arstechnica.com/security/2026/10/php-maintainers-tell-web-devs-to-prepare-themselves-for-critical-security-patches/	Ars Technica	news	\n                    Dan Goodin\n                	1	2026-10-22 08:17:05.479741	\N	0	10
276	GM is giving OnStar an AI makeover	https://techcrunch.com/2026/10/21/gm-is-giving-onstar-an-ai-makeover/	TechCrunch	news	Kirsten Korosec	1	2026-10-22 08:17:05.61727	\N	0	10
277	Merging SpaceX and Tesla would be a "good idea," Musk says	https://arstechnica.com/space/2026/10/spacex-and-tesla-into-a-single-company-has-a-lot-of-merit-musk-says/	Ars Technica	news	\n                    Eric Berger\n                	1	2026-10-22 08:17:05.757557	\N	0	10
278	PHP Armageddon: OpenAI, Google’s Wiz find ancient holes, panicking the internet	https://techcrunch.com/2026/10/21/php-armageddon-openai-googles-wiz-find-ancient-holes-panicking-the-internet/	TechCrunch	news	Julie Bort	1	2026-10-22 08:17:05.905499	\N	0	10
279	Cops raid office of RFK Jr. allies planning “unethical” vaccine trial on babies	https://arstechnica.com/health/2026/10/cops-raid-office-of-rfk-jr-allies-planning-unethical-vaccine-trial-on-babies/	Ars Technica	news	\n                    Beth Mole\n                	1	2026-10-22 08:17:06.040123	\N	0	10
280	Blacksmith hits unicorn valuation after Sequoia leads Series C	https://techcrunch.com/2026/10/21/blacksmith-hits-unicorn-valuation-after-sequoia-leads-series-c/	TechCrunch	news	Dominic-Madori Davis	1	2026-10-22 08:17:06.178289	\N	0	10
281	Microsoft reportedly projects $1,200 to $1,800 price for 2028 Project Helix	https://arstechnica.com/gaming/2026/10/report-microsofts-project-helix-planned-for-2028-at-1200-to-1800-price/	Ars Technica	news	\n                    Kyle Orland\n                	1	2026-10-22 08:17:06.317856	\N	0	10
282	Waymo starts offering rides at the Las Vegas airport	https://techcrunch.com/2026/10/21/waymo-starts-offering-rides-at-the-las-vegas-airport/	TechCrunch	news	Sean O'Kane	1	2026-10-22 08:17:06.44504	\N	0	10
283	JustWatch, which tackles streaming fragmentation, launches own streaming service	https://arstechnica.com/gadgets/2026/10/justwatch-which-tackles-streaming-fragmentation-launches-own-streaming-service/	Ars Technica	news	\n                    Scharon Harding\n                	1	2026-10-22 08:17:06.592091	\N	0	10
284	Foursquare co-founder says equity holders saw no returns from the company’s acquisition	https://techcrunch.com/2026/10/21/foursquare-co-founder-says-equity-holders-saw-no-returns-from-the-companys-acquisition/	TechCrunch	news	Ivan Mehta	1	2026-10-22 08:17:06.718249	\N	0	10
285	Meta drops the word "train" from its commercial TOS after AI backlash	https://arstechnica.com/tech-policy/2026/10/meta-drops-the-word-train-from-its-commercial-tos-after-ai-backlash/	Ars Technica	news	\n                    Ashley Belanger\n                	1	2026-10-22 08:17:06.881656	\N	0	10
286	Debunking "Faster than Rust": Malicious Benchmarks in Tov	https://www.reddit.com/r/programming/comments/1xcaveo/debunking_faster_than_rust_malicious_benchmarks/	Reddit Programming	ask	/u/madonuko	1	2026-10-22 08:17:19.412129	\N	0	10
287	Cybersecurity agency calls for immediate PHP updates over critical security flaws	https://www.reddit.com/r/programming/comments/1xcaeod/cybersecurity_agency_calls_for_immediate_php/	Reddit Programming	ask	/u/Familiar_Swimmer8952	1	2026-10-22 08:17:19.822795	\N	0	10
288	Eight Bits of Trust; eMudhra's CA keys cracked in milliseconds	https://www.reddit.com/r/programming/comments/1xbl8y1/eight_bits_of_trust_emudhras_ca_keys_cracked_in/	Reddit Programming	ask	/u/Dear-Economics-315	1	2026-10-22 08:17:19.959554	\N	0	10
289	PHP2Shell: Critical vulnerabilities in the backbone of the web	https://www.reddit.com/r/programming/comments/1xbo19y/php2shell_critical_vulnerabilities_in_the/	Reddit Programming	ask	/u/sagitz_	1	2026-10-22 08:17:20.08679	\N	0	10
290	Today's PHP Security Release, and How We're Strengthening PHP Security	https://www.reddit.com/r/programming/comments/1xbxrns/todays_php_security_release_and_how_were/	Reddit Programming	ask	/u/elizabethn	1	2026-10-22 08:17:20.227548	\N	0	10
291	TornadoVM 7 Enables GPU-Native Workloads From Java Applications	https://www.reddit.com/r/programming/comments/1xcc8i8/tornadovm_7_enables_gpunative_workloads_from_java/	Reddit Programming	ask	/u/benevanstech	1	2026-10-22 08:17:20.370825	\N	0	10
292	Critical Vulnerabilities in PHP	https://www.reddit.com/r/programming/comments/1xbcv7y/critical_vulnerabilities_in_php/	Reddit Programming	ask	/u/LordAlfredo	1	2026-10-22 08:17:20.509507	\N	0	10
293	Make yourself replaceable	https://www.reddit.com/r/programming/comments/1xb7t0x/make_yourself_replaceable/	Reddit Programming	ask	/u/maroun-baydoun	1	2026-10-22 08:17:20.648626	\N	0	10
294	C vs C#: racing VLC's Gaussian blur	https://www.reddit.com/r/programming/comments/1xbbkuq/c_vs_c_racing_vlcs_gaussian_blur/	Reddit Programming	ask	/u/mtz94	1	2026-10-22 08:17:20.779716	\N	0	10
295	go/ links that live in a file in your repo (open source)	https://www.reddit.com/r/programming/comments/1xbxzz2/go_links_that_live_in_a_file_in_your_repo_open/	Reddit Programming	ask	/u/Gaia_fawkes	1	2026-10-22 08:17:20.923206	\N	0	10
296	eMudhra Intermediate CA Compromise	https://www.reddit.com/r/programming/comments/1xb32yj/emudhra_intermediate_ca_compromise/	Reddit Programming	ask	/u/the_gnarts	1	2026-10-22 08:17:21.059601	\N	0	10
297	SSH keys on macOS with Touch ID	https://www.reddit.com/r/programming/comments/1xaqyzu/ssh_keys_on_macos_with_touch_id/	Reddit Programming	ask	/u/nmattia	1	2026-10-22 08:17:21.190766	\N	0	10
298	Unintended Computations @ hack.lu	https://www.reddit.com/r/programming/comments/1xbp8ti/unintended_computations_hacklu/	Reddit Programming	ask	/u/Dull_Replacement8890	1	2026-10-22 08:17:21.334696	\N	0	10
299	Go Issues Emergency Update Blocking Eight CA Keys Over Undisclosed Security Concerns	https://www.reddit.com/r/programming/comments/1xarfxg/go_issues_emergency_update_blocking_eight_ca_keys/	Reddit Programming	ask	/u/359Panda3U	1	2026-10-22 08:17:21.466028	\N	0	10
300	Announcing TypeScript 7.1 Beta	https://www.reddit.com/r/programming/comments/1xaz5ur/announcing_typescript_71_beta/	Reddit Programming	ask	/u/DanielRosenwasser	1	2026-10-22 08:17:21.599801	\N	0	10
301	JPA vs Hibernate vs JDBC: What Each One Actually Does | Visually Explained	https://www.reddit.com/r/programming/comments/1xbrs3g/jpa_vs_hibernate_vs_jdbc_what_each_one_actually/	Reddit Programming	ask	/u/correctMeIfImcorrect	1	2026-10-22 08:17:21.735701	\N	0	10
302	Why memory-hard proof-of-work hashes are not a popular choice for CAPTCHA	https://www.reddit.com/r/programming/comments/1xauiqk/why_memoryhard_proofofwork_hashes_are_not_a/	Reddit Programming	ask	/u/ribtoks	1	2026-10-22 08:17:21.864538	\N	0	10
303	Summary of Major Changes Between Python Versions (2026 Update)	https://www.reddit.com/r/programming/comments/1xbm5hd/summary_of_major_changes_between_python_versions/	Reddit Programming	ask	/u/nicholashairs	1	2026-10-22 08:17:22.010878	\N	0	10
304	Under the Hood of Redis: How It Delivers Sub-Millisecond Latency?	https://www.reddit.com/r/programming/comments/1xavhns/under_the_hood_of_redis_how_it_delivers/	Reddit Programming	ask	/u/javinpaul	1	2026-10-22 08:17:22.141509	\N	0	10
305	Think Php2Shell Was Bad? PHP Is About to Face an Absolute Bloodbath	https://www.reddit.com/r/programming/comments/1xc2q5n/think_php2shell_was_bad_php_is_about_to_face_an/	Reddit Programming	ask	/u/derjanni	1	2026-10-22 08:17:22.283686	\N	0	10
306	Making A Mutex from Scratch in Rust to Understand Thread Safety	https://www.reddit.com/r/programming/comments/1xav3jo/making_a_mutex_from_scratch_in_rust_to_understand/	Reddit Programming	ask	/u/PastEar9661	1	2026-10-22 08:17:22.419578	\N	0	10
307	The reverts will continue until morale improves [PostgreSQL 19]	https://www.reddit.com/r/programming/comments/1xa9h5w/the_reverts_will_continue_until_morale_improves/	Reddit Programming	ask	/u/currentscurrents	1	2026-10-22 08:17:22.551656	\N	0	10
308	The compiler was supposed to end programming too	https://www.reddit.com/r/programming/comments/1xbt2sr/the_compiler_was_supposed_to_end_programming_too/	Reddit Programming	ask	/u/Don_Crespo	1	2026-10-22 08:17:22.68172	\N	0	10
309	GitHub Actions is down once again	https://www.reddit.com/r/programming/comments/1xa0z6c/github_actions_is_down_once_again/	Reddit Programming	ask	/u/BitFlipp3r	1	2026-10-22 08:17:22.810765	\N	0	10
310	Making software is an artistic activity	https://www.reddit.com/r/programming/comments/1xa4bck/making_software_is_an_artistic_activity/	Reddit Programming	ask	/u/foobear777	1	2026-10-22 08:17:22.948648	\N	0	10
311	ElevenLabs Realtime Translation	https://www.producthunt.com/products/elevenlabs-realtime-translation	Product Hunt	show	Kate Ramakaieva	1	2026-10-22 08:17:33.456598	\N	0	10
312	The DelightQL Query Language	https://delightql.org	Lobsters Show	show	delightql.org by reverendpaco	1	2026-10-22 08:17:33.878454	\N	0	10
313	heal.dev	https://www.producthunt.com/products/heal-dev	Product Hunt	show	Ben Lang	1	2026-10-22 08:17:34.017464	\N	0	10
314	Easylang: A Simple, Browser-Based Programming Language in the Spirit of the Old Home Computer BASIC	https://easylang.online/ide	Lobsters Show	show	easylang.online by chkas	1	2026-10-22 08:17:34.163398	\N	0	10
315	Teclo	https://www.producthunt.com/products/teclo	Product Hunt	show	Perseu	1	2026-10-22 08:17:34.297373	\N	0	10
316	Thrive: free, open-source game about the evolution of life	https://www.revolutionarygamesstudio.com/index	Lobsters Show	show	revolutionarygamesstudio.com via confusedalex	1	2026-10-22 08:17:34.44039	\N	0	10
317	Fastlane 2.0	https://www.producthunt.com/products/fastlane-3	Product Hunt	show	Rohan Chaubey	1	2026-10-22 08:17:34.563467	\N	0	10
318	json2dir: Directory archives, made human-readable	https://github.com/alurm/json2dir	Lobsters Show	show	github.com via alurm	1	2026-10-22 08:17:34.705485	\N	0	10
319	Mercury 3	https://www.producthunt.com/products/mercury-412	Product Hunt	show	Zac Zuo	1	2026-10-22 08:17:34.857473	\N	0	10
320	Pared - remove unwanted Apple Intelligence models without disabling SIP	https://github.com/4evy/pared	Lobsters Show	show	github.com by FlameFlag	1	2026-10-22 08:17:34.998416	\N	0	10
321	Claire Mail	https://www.producthunt.com/products/claire-mail	Product Hunt	show	Foued Sassi	1	2026-10-22 08:17:35.136433	\N	0	10
322	Brut, the Brutal Router for Unix Tools	https://brut.sh	Lobsters Show	show	brut.sh by sstephenson	1	2026-10-22 08:17:35.274225	\N	0	10
323	Causo	https://www.producthunt.com/products/causo	Product Hunt	show	Ivan Semenov	1	2026-10-22 08:17:35.398482	\N	0	10
324	outis: Fight AI spam by generating and sending a fake "user unknown" bounce emails	https://github.com/dtonon/outis	Lobsters Show	show	github.com by daniele	1	2026-10-22 08:17:35.541564	\N	0	10
325	CutBay	https://www.producthunt.com/products/cutbay	Product Hunt	show	Kevin William David	1	2026-10-22 08:17:35.680905	\N	0	10
326	ASM Bots: Core War in real 8086 machine code	https://asmbots.io	Lobsters Show	show	asmbots.io by sirbrightool	1	2026-10-22 08:17:35.820569	\N	0	10
327	Mistral Voxtral 3	https://www.producthunt.com/products/mistral-7b	Product Hunt	show	Rohan Chaubey	1	2026-10-22 08:17:35.960513	\N	0	10
328	The Shell & Email	https://www.machtiani.chat/blogs/the-shell	Lobsters Show	show	machtiani.chat by abstract777	1	2026-10-22 08:17:36.106316	\N	0	10
329	Kugel Ear	https://www.producthunt.com/products/kugelaudio	Product Hunt	show	Kajo Kratzenstein	1	2026-10-22 08:17:36.233394	\N	0	10
330	weave: structural merging for different languages	https://github.com/Ataraxy-Labs/weave	Lobsters Show	show	github.com by rs545837	1	2026-10-22 08:17:36.372568	\N	0	10
331	Whiteboard	https://www.producthunt.com/products/whiteboard-5	Product Hunt	show	Garry Tan	1	2026-10-22 08:17:36.508432	\N	0	10
332	Jev-powered autocorrection	https://levmiseri.com/nospace	Lobsters Show	show	levmiseri.com by wherewhy	1	2026-10-22 08:17:36.650439	\N	0	10
333	Record for agents	https://www.producthunt.com/products/loom	Product Hunt	show	Kristie Riojas	1	2026-10-22 08:17:36.781471	\N	0	10
334	Running an Optimal Trace	https://anishathalye.com/optimal-trace/	Lobsters Show	show	anishathalye.com by anishathalye	1	2026-10-22 08:17:36.916456	\N	0	10
335	DeepCell	https://www.producthunt.com/products/deepcell	Product Hunt	show	Justin Jincaid	1	2026-10-22 08:17:37.039612	\N	0	10
336	Squalk: an old-school forum engine built on Nostr (NIP-29 groups, NIP-7D threads)	https://github.com/dtonon/squalk	Lobsters Show	show	github.com by daniele	1	2026-10-22 08:17:37.173467	\N	0	10
337	Claude Duet	https://www.producthunt.com/products/claude	Product Hunt	show	Chris Messina	1	2026-10-22 08:17:37.299103	\N	0	10
338	txcript: Switching coding agents mid-conversation	https://github.com/skillsynchq/txcript	Lobsters Show	show	github.com by nishantjosh	1	2026-10-22 08:17:37.441429	\N	0	10
339	Playad	https://www.producthunt.com/products/playad	Product Hunt	show	Youn Hwang	1	2026-10-22 08:17:37.57186	\N	0	10
340	zopt: low-ceremony command line parsing for Zig	https://codeberg.org/hgrsd/zopt	Lobsters Show	show	codeberg.org by hgrsd	1	2026-10-22 08:17:37.707469	\N	0	10
341	Dadan	https://www.producthunt.com/products/dadan	Product Hunt	show	Kevin William David	1	2026-10-22 08:17:37.833443	\N	0	10
342	An image only some users can see	https://d.erenrich.net/apple.avif	Lobsters Show	show	d.erenrich.net by derenrich	1	2026-10-22 08:17:37.98047	\N	0	10
343	Notif	https://www.producthunt.com/products/notif-2	Product Hunt	show	Andrew Amisola	1	2026-10-22 08:17:38.133422	\N	0	10
344	deforester - Logging for Janet	https://codeberg.org/veqq/deforester	Lobsters Show	show	codeberg.org by veqq	1	2026-10-22 08:17:38.268485	\N	0	10
345	Voxelo 3.0	https://www.producthunt.com/products/voxelo-ai	Product Hunt	show	Ben McKay	1	2026-10-22 08:17:38.399531	\N	0	10
346	Texttile, a multiplayer blog engine for people who write together	https://www.v01.io/posts/2026/08/texttile/	Lobsters Show	show	v01.io by klausbreyer	1	2026-10-22 08:17:38.533404	\N	0	10
347	Doneas	https://www.producthunt.com/products/doneas	Product Hunt	show	Bengeekly	1	2026-10-22 08:17:38.6645	\N	0	10
348	Small and reasonably fast QOI decoder written in zig	https://github.com/sorvi-platform/dekoodaaja	Lobsters Show	show	github.com by Cloudef	1	2026-10-22 08:17:38.798976	\N	0	10
349	Archivist	https://www.producthunt.com/products/archivist	Product Hunt	show	Cornelia Süß	1	2026-10-22 08:17:38.930562	\N	0	10
350	maiao: Gerrit-style stacked diffs for GitHub, Cursor Origin, GitLab, Codeberg and more	https://github.com/runetes/maiao	Lobsters Show	show	github.com by joaoqalves	1	2026-10-22 08:17:39.076542	\N	0	10
351	Radaric	https://www.producthunt.com/products/radaric	Product Hunt	show	Kirill Oleinichenko	1	2026-10-22 08:17:39.2185	\N	0	10
352	Routeup – stable local HTTPS URLs and opt-in public tunnels	https://routeup.dev	Lobsters Show	show	routeup.dev by mukul	1	2026-10-22 08:17:39.360074	\N	0	10
353	Bits	https://www.producthunt.com/products/bits-4	Product Hunt	show	Harsh Patel	1	2026-10-22 08:17:39.483414	\N	0	10
354	nss-userhosts - hosts files for unprivileged users	https://codeberg.org/felixs/nss-userhosts	Lobsters Show	show	codeberg.org by felixs	1	2026-10-22 08:17:39.618136	\N	0	10
355	Resend Inboxes	https://www.producthunt.com/products/resend	Product Hunt	show	fmerian	1	2026-10-22 08:17:39.76048	\N	0	10
356	capri: Type-safe, atomic Gleam bindings for Khepri, the modern distributed database for the BEAM	https://capri.hexdocs.pm/	Lobsters Show	show	capri.hexdocs.pm by reesericci	1	2026-10-22 08:17:39.899484	\N	0	10
357	Sponkly	https://www.producthunt.com/products/sponkly	Product Hunt	show	Süleyman KAŞIKÇI	1	2026-10-22 08:17:40.023595	\N	0	10
358	Tsampi BFT: Leaderless One-Round Voting with Parameterized Finality	https://www.tsampi.com/tsampi-bft-1.1.pdf	Lobsters Show	show	tsampi.com by readevalprint	1	2026-10-22 08:17:40.158373	\N	0	10
359	SuperCMO AI	https://www.producthunt.com/products/supercmo-ai	Product Hunt	show	Kshitiz Kumar	1	2026-10-22 08:17:40.290451	\N	0	10
360	What do you think of LazyPromise as a lightweight alternative to Effect?	https://github.com/lazy-promise/lazy-promise	Lobsters Show	show	github.com by ivan7237d	1	2026-10-22 08:17:40.431468	\N	0	10
361	Affirm: Analytics Engineer II, Full Stack (Revenue Analytics)	https://weworkremotely.com/remote-jobs/affirm-analytics-engineer-ii-full-stack-revenue-analytics	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:47.836813	\N	0	10
362	Netlify: Senior Staff Data Scientist	https://weworkremotely.com/remote-jobs/netlify-senior-staff-data-scientist	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:48.240984	\N	0	10
363	Mercury: Business Continuity Management Lead	https://weworkremotely.com/remote-jobs/mercury-business-continuity-management-lead	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:48.376705	\N	0	10
364	OfferUp: Software Development Engineer II (Remote @ Colombia)	https://weworkremotely.com/remote-jobs/offerup-software-development-engineer-ii-remote-colombia	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:48.508016	\N	0	10
365	Maven Clinic: Head of Member Growth (B2B2C)	https://weworkremotely.com/remote-jobs/maven-clinic-head-of-member-growth-b2b2c	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:48.636878	\N	0	10
366	Lemon.io: Senior Vue Developer	https://weworkremotely.com/remote-jobs/lemon-io-senior-vue-developer-1	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:48.772363	\N	0	10
367	Ritual: Core Protocol Engineer	https://weworkremotely.com/remote-jobs/ritual-core-protocol-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:48.901862	\N	0	10
368	Oportun: Senior Data Engineer - Capital Markets (R13923)	https://weworkremotely.com/remote-jobs/oportun-senior-data-engineer-capital-markets-r13923	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:49.033527	\N	0	10
369	Toptal: Senior Analytics Engineer / BI Lead — Channel Insights (iX360)	https://weworkremotely.com/remote-jobs/toptal-senior-analytics-engineer-bi-lead-channel-insights-ix360	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:49.173997	\N	0	10
370	Toptal: Salesforce Developer for Org Ownership and Ongoing Platform Development	https://weworkremotely.com/remote-jobs/toptal-salesforce-developer-for-org-ownership-and-ongoing-platform-development	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:49.311144	\N	0	10
371	Celonis: Client Value Partner (CVP) - Utilities & Energy Industry	https://weworkremotely.com/remote-jobs/celonis-client-value-partner-cvp-utilities-energy-industry	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:49.456715	\N	0	10
372	Celonis: Client Value Partner (CVP) - Oil & Gas Industry	https://weworkremotely.com/remote-jobs/celonis-client-value-partner-cvp-oil-gas-industry	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:49.588097	\N	0	10
373	Reddit: Analytics Engineer	https://weworkremotely.com/remote-jobs/reddit-analytics-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:49.716839	\N	0	10
374	Growth Minded: Senior Data Engineer	https://weworkremotely.com/remote-jobs/growth-minded-senior-data-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:49.842974	\N	0	10
375	BDF EXPERTS: SAP Berater FI/CO (M/W/D)	https://weworkremotely.com/remote-jobs/bdf-experts-sap-berater-fi-co-m-w-d	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:49.983672	\N	0	10
376	Proxify AB: Senior Fullstack Developer (React.js / Node.js)	https://weworkremotely.com/remote-jobs/proxify-ab-senior-fullstack-developer-react-js-node-js-5	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:50.118957	\N	0	10
377	Clover Health: Director, AI-Enabled Fraud Prevention & Investigations	https://weworkremotely.com/remote-jobs/clover-health-director-ai-enabled-fraud-prevention-investigations	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:50.246801	\N	0	10
378	Lithic: Senior Software Engineer, Product Platform	https://weworkremotely.com/remote-jobs/lithic-senior-software-engineer-product-platform	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:50.384234	\N	0	10
379	Alloy: Founding Forward Deployed Engineer	https://weworkremotely.com/remote-jobs/alloy-founding-forward-deployed-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:50.523803	\N	0	10
380	Airbnb: Operations Engineer, BizTech	https://weworkremotely.com/remote-jobs/airbnb-operations-engineer-biztech	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:50.67196	\N	0	10
381	Lithic: Senior Software Engineer, Processing	https://weworkremotely.com/remote-jobs/lithic-senior-software-engineer-processing	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:50.80093	\N	0	10
382	Dremio: Staff Software Engineer - Connectivity	https://weworkremotely.com/remote-jobs/dremio-staff-software-engineer-connectivity	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:50.936082	\N	0	10
383	Mixpanel: Customer Value Architect III	https://weworkremotely.com/remote-jobs/mixpanel-customer-value-architect-iii-1	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:51.070856	\N	0	10
384	Mixpanel: Customer Value Architect III	https://weworkremotely.com/remote-jobs/mixpanel-customer-value-architect-iii	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:51.200558	\N	0	10
385	Sanctuary Computer: Head of Technology	https://weworkremotely.com/remote-jobs/sanctuary-computer-head-of-technology	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:51.344757	\N	0	10
386	Maven Clinic: Director, Marketing Operations	https://weworkremotely.com/remote-jobs/maven-clinic-director-marketing-operations	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:51.478337	\N	0	10
387	Maven Clinic: Care Coach	https://weworkremotely.com/remote-jobs/maven-clinic-care-coach	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:51.619679	\N	0	10
388	Fivetran : Global Alliance Lead, Capgemini	https://weworkremotely.com/remote-jobs/fivetran-global-alliance-lead-capgemini	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:51.777005	\N	0	10
389	Askable: Software Engineer, AI Coding Tasks (Contract) 	https://weworkremotely.com/remote-jobs/askable-software-engineer-ai-coding-tasks-contract	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:51.916773	\N	0	10
390	Medify: Engineering Manager	https://weworkremotely.com/remote-jobs/medify-engineering-manager	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:52.057136	\N	0	10
391	Lattice: Senior Software Engineer, Infrastructure Platform	https://weworkremotely.com/remote-jobs/lattice-senior-software-engineer-infrastructure-platform	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:52.196721	\N	0	10
392	StockX: Category Manager - Apparel	https://weworkremotely.com/remote-jobs/stockx-category-manager-apparel	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:52.338261	\N	0	10
393	Databricks: Deployment Strategist	https://weworkremotely.com/remote-jobs/databricks-deployment-strategist	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:52.477056	\N	0	10
394	Coinbase: Analyst, Privacy (Privacy Assessments)	https://weworkremotely.com/remote-jobs/coinbase-analyst-privacy-privacy-assessments	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:52.621057	\N	0	10
395	Melio: Senior Talent Acquisition Partner (Contract)	https://weworkremotely.com/remote-jobs/melio-senior-talent-acquisition-partner-contract	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:52.756684	\N	0	10
396	Toptal: Applied AI Engineers for telecommunications company	https://weworkremotely.com/remote-jobs/toptal-applied-ai-engineers-for-telecommunications-company	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:52.905146	\N	0	10
397	Toptal: Apigee Engineer for Global Consumer Food Company	https://weworkremotely.com/remote-jobs/toptal-apigee-engineer-for-global-consumer-food-company	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:53.046723	\N	0	10
398	Toptal: Salesforce Developers with AI-Assisted Coding Experience	https://weworkremotely.com/remote-jobs/toptal-salesforce-developers-with-ai-assisted-coding-experience	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:53.185147	\N	0	10
399	Toptal: Full-Stack E-commerce Developer with Sage X3 Experience	https://weworkremotely.com/remote-jobs/toptal-full-stack-e-commerce-developer-with-sage-x3-experience	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:53.32382	\N	0	10
400	Vercel: Software Engineer - Data Platform	https://weworkremotely.com/remote-jobs/vercel-software-engineer-data-platform	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:53.481044	\N	0	10
401	Vercel: Software Engineer, Backend	https://weworkremotely.com/remote-jobs/vercel-software-engineer-backend	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:53.614882	\N	0	10
402	Maven Clinic: Client Success Manager	https://weworkremotely.com/remote-jobs/maven-clinic-client-success-manager	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:53.759963	\N	0	10
403	Typeform: Full Stack Developer	https://weworkremotely.com/remote-jobs/typeform-full-stack-developer	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:53.90176	\N	0	10
404	Jumio: Machine Learning Engineer - IV (Computer Vision)	https://weworkremotely.com/remote-jobs/jumio-machine-learning-engineer-iv-computer-vision	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:54.037888	\N	0	10
405	Lemon.io: Senior React Full-stack Developer	https://weworkremotely.com/remote-jobs/lemon-io-senior-react-full-stack-developer-7	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:54.166824	\N	0	10
406	Lemon.io: Senior .NET Full-stack Developer	https://weworkremotely.com/remote-jobs/lemon-io-senior-net-full-stack-developer-2	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:54.297969	\N	0	10
407	Jumio: Machine Learning Engineer - IV (Biometrics)	https://weworkremotely.com/remote-jobs/jumio-machine-learning-engineer-iv-biometrics	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:54.434781	\N	0	10
408	Jumio: Machine Learning Engineer	https://weworkremotely.com/remote-jobs/jumio-machine-learning-engineer	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:54.570021	\N	0	10
409	Abnormal: Director of Security Engineering	https://weworkremotely.com/remote-jobs/abnormal-director-of-security-engineering	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:54.712934	\N	0	10
410	Coinbase: Analyst, Privacy	https://weworkremotely.com/remote-jobs/coinbase-analyst-privacy	We Work Remotely	jobs	We Work Remotely	1	2026-10-22 08:17:54.843002	\N	0	10
411	OpenUI - Lo standard aperto per le interfacce utente generative	https://github.com/thesysdev/openui	github.com	show	community	1	2026-10-24 05:17:44.709186	1	0	30
\.


--
-- Data for Name: pulse_user_xp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pulse_user_xp (id, xp, level, updated_at, user_id) FROM stdin;
\.


--
-- Data for Name: user_xp_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_xp_transactions (id, user_id, amount, action_type, description, created_at) FROM stdin;
1	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 11:15:32.336301
2	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 11:24:39.161437
3	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 12:10:29.12359
4	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 12:21:48.238787
5	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 12:31:01.882379
6	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 12:33:23.827213
7	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 12:37:00.915124
8	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 12:44:35.506617
9	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 12:47:09.459111
10	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 12:53:20.396646
11	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 13:00:17.311341
12	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 13:10:52.388911
13	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 13:11:42.772552
14	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 13:19:52.774388
15	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 13:24:02.840376
16	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 13:28:52.396358
17	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 13:35:06.781749
18	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 13:40:21.312131
19	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 13:44:29.766949
20	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 13:47:09.083655
21	1	30	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 16:05:30.800929
22	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 16:15:06.538791
23	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-21 19:51:00.023291
24	1	30	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-22 14:36:13.940625
25	1	150	ARTICLE_PUBLISHED	Pubblicazione articolo: Introduzione al Protocollo Pul...	2026-10-22 17:02:18.84311
26	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-22 17:05:47.960656
27	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-23 03:58:27.922632
28	1	30	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-23 06:03:15.316777
29	1	10	CHAT_NEXUS	Interazione con Pulse Nexus Companion	2026-10-23 06:04:02.441313
30	1	150	ARTICLE_PUBLISHED	Pubblicazione articolo: Come l'intelligenza artificial...	2026-10-23 13:14:31.338176
31	1	150	ARTICLE_PUBLISHED	Pubblicazione articolo: Progettare uno schema SQL: tab...	2026-10-23 14:46:12.690865
32	1	150	ARTICLE_PUBLISHED	Pubblicazione articolo: Rust per chi sviluppa backend:...	2026-10-25 04:46:26.163273
33	1	150	ARTICLE_PUBLISHED	Pubblicazione articolo: Progettare una pipeline CI/CD:...	2026-10-25 05:54:17.037687
34	1	150	ARTICLE_PUBLISHED	Pubblicazione articolo: Zero Trust Architecture: Proge...	2026-10-25 07:13:16.717284
35	1	150	ARTICLE_PUBLISHED	Pubblicazione articolo: OWASP Top 10 2026: SQL Injecti...	2026-10-25 08:05:33.702791
36	1	150	ARTICLE_PUBLISHED	Pubblicazione articolo: Platform Engineering: Costruir...	2026-10-25 11:48:49.424258
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (username, bio, created_at, id, email, password_hash, role, avatar_url, reputation, github_handle, xp, level, badges, pulse_balance) FROM stdin;
available-groups	Membro della community di DevKernelPulse.	2026-10-16 22:58:39.228522	41	available-groups@devkernelpulse.local	\N	user	\N	100	\N	750	1	[]	0
keys	Membro della community di DevKernelPulse.	2026-10-16 22:58:40.495128	42	keys@devkernelpulse.local	\N	user	\N	100	\N	150	1	[]	0
api-keys	Membro della community di DevKernelPulse.	2026-10-16 22:58:43.516988	43	api-keys@devkernelpulse.local	\N	user	\N	100	\N	150	1	[]	0
models	Membro della community di DevKernelPulse.	2026-10-16 22:58:44.379488	44	models@devkernelpulse.local	\N	user	\N	100	\N	150	1	[]	0
available_models	Membro della community di DevKernelPulse.	2026-10-16 22:58:45.648505	45	available_models@devkernelpulse.local	\N	user	\N	100	\N	150	1	[]	0
profile	Membro della community di DevKernelPulse.	2026-10-16 13:37:42.750435	38	profile@devkernelpulse.local	\N	user	\N	100	\N	300	1	[]	0
hacker_test	\N	2026-10-18 14:44:20.165397	46	test@dkp.com	\N	user	\N	100	\N	150	1	[]	0
self	Membro della community di DevKernelPulse.	2026-10-19 10:12:26.930313	47	self@devkernelpulse.local	\N	user	\N	100	\N	150	1	[]	0
me	Membro della community di DevKernelPulse.	2026-10-16 22:58:31.068073	39	me@devkernelpulse.local	\N	user	\N	100	\N	300	1	[]	0
alexdpl	\N	2026-09-25 12:27:05.514865	1	alexdpl@devkernelpulse.org	\N	admin	\N	100	\N	1920	19	["Early Pioneer", "Core Developer"]	0
groups	Membro della community di DevKernelPulse.	2026-10-16 22:58:36.437668	40	groups@devkernelpulse.local	\N	user	\N	100	\N	300	1	[]	0
\.


--
-- Data for Name: vault_certs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vault_certs (id, user_id, tool_type, title, hash, metadata, created_at) FROM stdin;
1	1	proof-of-code	server/api/blog/submit.post.ts	dkp_vlt_bvwmkrhl7vnnc1x9rg06dfqok1tcivwn	{"snippet": "import { defineEventHandler, readBody, createError } from 'h3'\\nimport crypto from 'node:crypto'\\n\\n// --- PULSE SENTINEL A", "sastStatus": "PASSED"}	2026-10-16 03:33:48.809521
2	1	proof-of-code	server/api/auth/[provider].get.ts	dkp_vlt_bh22w8vo5d7oyxdhzkm8rmmscdkkkvqdq	{"snippet": "import { defineEventHandler, getRouterParam, setCookie, sendRedirect } from 'h3'\\n\\nexport default defineEventHandler(asyn", "sastStatus": "PASSED"}	2026-10-16 03:37:21.132544
3	1	proof-of-code	app/components/blog/DkpEditor.vue	dkp_vlt_mypvdjo2288eps42tsocktqzhg4y2g21g	{"snippet": "<script setup lang=\\"ts\\">\\nimport { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'\\nimport DkpTagInput", "sastStatus": "PASSED"}	2026-10-16 03:44:07.717427
4	1	proof-of-code	Audit Repo: alexdpl/hackernews	dkp_vlt_t2j4ity86hewrxc9s3rsz9m3ad1gprbz	{"snippet": "{\\n  \\"url\\": \\"https://github.com/alexdpl/hackernews\\",\\n  \\"score\\": 100,\\n  \\"tier\\": \\"S-TIER GOLD\\"\\n}", "sastStatus": "PASSED"}	2026-10-16 07:00:37.363973
5	1	proof-of-code	server/api/submit.post.ts	dkp_vlt_5x0416lb0ggtq62iitgvfls5ihx4vjrx	{"snippet": "// server/api/submit.post.ts\\nimport { getDb } from '~~/server/utils/db'\\nimport { blogPosts } from '~~/drizzle/schema'\\nim", "sastStatus": "PASSED"}	2026-10-16 07:44:43.383277
\.


--
-- Data for Name: votes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.votes (id, post_id, username, created_at) FROM stdin;
\.


--
-- Data for Name: xp_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.xp_transactions (id, user_id, action, points, created_at) FROM stdin;
1	1	Notarizzazione Vault: "server/api/blog/submit.post.ts"	100	2026-10-16 03:33:49.211845
2	1	Notarizzazione Vault: "server/api/auth/[provider].get"	100	2026-10-16 03:37:21.517164
3	1	Notarizzazione Vault: "app/components/blog/DkpEditor."	100	2026-10-16 03:44:08.095916
4	1	Pubblicazione articolo: "Scrivere un tool CLI di sistem..."	150	2026-10-16 05:04:22.275683
5	1	Pubblicazione articolo: "Drizzle ORM con Neon: schema, ..."	150	2026-10-16 06:09:31.441601
6	1	Audit Repo GitHub: nuxt/nuxt	50	2026-10-16 06:59:43.029479
7	1	Audit Repo GitHub: nuxt/nuxt	50	2026-10-16 06:59:46.879841
8	1	Audit Repo GitHub: alexdpl/hackernews	50	2026-10-16 07:00:14.999869
9	1	Notarizzazione Vault: "Audit Repo: alexdpl/hackernews"	100	2026-10-16 07:00:37.813327
10	1	Audit Repo GitHub: alexdpl/hackernews	50	2026-10-16 07:04:45.426263
11	1	Audit Repo GitHub: alexdpl/hackernews	50	2026-10-16 07:06:54.951499
12	1	AI Code Scan (Score: 100/100)	30	2026-10-16 07:24:14.848559
13	1	Audit Repo GitHub: nuxt/nuxt	50	2026-10-16 07:30:26.422917
14	1	Esecuzione Modello: DKP-Neural-v4 (Coder)	15	2026-10-16 07:40:09.323925
15	1	Notarizzazione Vault: "server/api/submit.post.ts"	100	2026-10-16 07:44:43.910449
16	1	Terminal Command: dkp hack	50	2026-10-16 07:59:20.456846
17	1	Terminal Command: help	5	2026-10-16 13:57:50.392373
18	38	Pubblicazione articolo: "GCP, Azure o AWS? Come sceglie..."	150	2026-10-17 05:29:29.589906
19	1	Pubblicazione articolo: "Da sviluppatore a tech lead: r..."	150	2026-10-17 06:59:14.566856
20	39	Pubblicazione articolo: "Pubblicare un progetto open so..."	150	2026-10-19 17:48:19.408595
21	40	Pubblicazione articolo: "Nuxt per chi conosce Vue: pagi..."	150	2026-10-20 05:13:27.197058
22	41	Pubblicazione articolo: "Come proteggere le API con OAu..."	150	2026-10-20 07:02:25.705867
23	42	Pubblicazione articolo: "DevKernelPulse v2.5-GOLD: Arch..."	150	2026-10-20 15:57:06.533658
24	43	Pubblicazione articolo: "Inside Pulse Sentinel AI v2.5:..."	150	2026-10-20 17:08:40.932592
25	44	Pubblicazione articolo: "Open Source + SaaS Ibrido: Per..."	150	2026-10-20 17:50:05.405684
26	45	Pubblicazione articolo: "TypeScript per chi conosce Jav..."	150	2026-10-21 05:30:06.553659
27	38	Pubblicazione articolo: "React Native con Expo: creare ..."	150	2026-10-21 06:51:54.667134
28	46	Pubblicazione articolo: "Introduzione al Protocollo Pul..."	150	2026-10-22 17:02:18.084105
29	1	Nexus Chat: Ciao Nexus per il Vault?...	30	2026-10-23 06:03:06.746389
30	1	Nexus Chat: si prova grazie...	10	2026-10-23 06:03:40.230513
31	47	Pubblicazione articolo: "Come l'intelligenza artificial..."	150	2026-10-23 13:14:30.513442
32	39	Pubblicazione articolo: "Progettare uno schema SQL: tab..."	150	2026-10-23 14:46:12.045412
33	1	Pulse Submit [SHOW]: OpenUI - Lo standard aperto pe...	30	2026-10-24 05:17:45.289046
34	40	Pubblicazione articolo: "Rust per chi sviluppa backend:..."	150	2026-10-25 04:46:25.554351
35	41	Pubblicazione articolo: "Progettare una pipeline CI/CD:..."	150	2026-10-25 05:54:16.185571
36	41	Pubblicazione articolo: "Zero Trust Architecture: Proge..."	150	2026-10-25 07:13:16.097833
37	41	Pubblicazione articolo: "OWASP Top 10 2026: SQL Injecti..."	150	2026-10-25 08:05:32.919237
38	41	Pubblicazione articolo: "Platform Engineering: Costruir..."	150	2026-10-25 11:48:48.855827
\.


--
-- Name: alert_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.alert_logs_id_seq', 1, false);


--
-- Name: api_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.api_keys_id_seq', 8, true);


--
-- Name: api_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.api_logs_id_seq', 1, true);


--
-- Name: blog_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.blog_categories_id_seq', 19, true);


--
-- Name: blog_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.blog_comments_id_seq', 1, false);


--
-- Name: blog_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.blog_posts_id_seq', 60, true);


--
-- Name: blog_subcategories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.blog_subcategories_id_seq', 325, true);


--
-- Name: bounties_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bounties_id_seq', 1, false);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.comments_id_seq', 1, false);


--
-- Name: dkp_crawler_licenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.dkp_crawler_licenses_id_seq', 2, true);


--
-- Name: ip_blacklist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ip_blacklist_id_seq', 44, true);


--
-- Name: ip_whitelist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ip_whitelist_id_seq', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.posts_id_seq', 130, true);


--
-- Name: pulse_chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pulse_chat_messages_id_seq', 22, true);


--
-- Name: pulse_mail_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pulse_mail_messages_id_seq', 1, false);


--
-- Name: pulse_stories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pulse_stories_id_seq', 411, true);


--
-- Name: pulse_user_xp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pulse_user_xp_id_seq', 4, true);


--
-- Name: user_xp_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_xp_transactions_id_seq', 36, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 47, true);


--
-- Name: vault_certs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vault_certs_id_seq', 5, true);


--
-- Name: votes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.votes_id_seq', 1, false);


--
-- Name: xp_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.xp_transactions_id_seq', 38, true);


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: alert_logs alert_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alert_logs
    ADD CONSTRAINT alert_logs_pkey PRIMARY KEY (id);


--
-- Name: api_keys api_keys_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_hash_key UNIQUE (key_hash);


--
-- Name: api_keys api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);


--
-- Name: api_logs api_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_logs
    ADD CONSTRAINT api_logs_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_slug_unique UNIQUE (slug);


--
-- Name: blog_comments blog_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);


--
-- Name: blog_subcategories blog_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_subcategories
    ADD CONSTRAINT blog_subcategories_pkey PRIMARY KEY (id);


--
-- Name: blog_subcategories blog_subcategories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_subcategories
    ADD CONSTRAINT blog_subcategories_slug_unique UNIQUE (slug);


--
-- Name: bounties bounties_github_issue_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bounties
    ADD CONSTRAINT bounties_github_issue_id_unique UNIQUE (github_issue_id);


--
-- Name: bounties bounties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bounties
    ADD CONSTRAINT bounties_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: dkp_ads dkp_ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dkp_ads
    ADD CONSTRAINT dkp_ads_pkey PRIMARY KEY (id);


--
-- Name: dkp_crawler_licenses dkp_crawler_licenses_license_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dkp_crawler_licenses
    ADD CONSTRAINT dkp_crawler_licenses_license_key_unique UNIQUE (license_key);


--
-- Name: dkp_crawler_licenses dkp_crawler_licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dkp_crawler_licenses
    ADD CONSTRAINT dkp_crawler_licenses_pkey PRIMARY KEY (id);


--
-- Name: ip_blacklist ip_blacklist_ip_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ip_blacklist
    ADD CONSTRAINT ip_blacklist_ip_unique UNIQUE (ip);


--
-- Name: ip_blacklist ip_blacklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ip_blacklist
    ADD CONSTRAINT ip_blacklist_pkey PRIMARY KEY (id);


--
-- Name: ip_whitelist ip_whitelist_ip_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ip_whitelist
    ADD CONSTRAINT ip_whitelist_ip_key UNIQUE (ip);


--
-- Name: ip_whitelist ip_whitelist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ip_whitelist
    ADD CONSTRAINT ip_whitelist_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_license_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_license_key_unique UNIQUE (license_key);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: orders orders_payment_intent_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_payment_intent_id_unique UNIQUE (payment_intent_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: pulse_chat_messages pulse_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pulse_chat_messages
    ADD CONSTRAINT pulse_chat_messages_pkey PRIMARY KEY (id);


--
-- Name: pulse_mail_messages pulse_mail_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pulse_mail_messages
    ADD CONSTRAINT pulse_mail_messages_pkey PRIMARY KEY (id);


--
-- Name: pulse_stories pulse_stories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pulse_stories
    ADD CONSTRAINT pulse_stories_pkey PRIMARY KEY (id);


--
-- Name: pulse_user_xp pulse_user_xp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pulse_user_xp
    ADD CONSTRAINT pulse_user_xp_pkey PRIMARY KEY (id);


--
-- Name: votes unique_user_post_vote; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT unique_user_post_vote UNIQUE (post_id, username);


--
-- Name: user_xp_transactions user_xp_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_xp_transactions
    ADD CONSTRAINT user_xp_transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: vault_certs vault_certs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_certs
    ADD CONSTRAINT vault_certs_pkey PRIMARY KEY (id);


--
-- Name: votes votes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_pkey PRIMARY KEY (id);


--
-- Name: xp_transactions xp_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions
    ADD CONSTRAINT xp_transactions_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: organization_slug_uidx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE UNIQUE INDEX organization_slug_uidx ON neon_auth.organization USING btree (slug);


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: idx_api_keys_key_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_key_hash ON public.api_keys USING btree (key_hash);


--
-- Name: idx_api_keys_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_keys_user_id ON public.api_keys USING btree (user_id);


--
-- Name: idx_api_logs_api_key_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_logs_api_key_id ON public.api_logs USING btree (api_key_id);


--
-- Name: idx_api_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_logs_created_at ON public.api_logs USING btree (created_at);


--
-- Name: idx_api_logs_status_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_api_logs_status_code ON public.api_logs USING btree (status_code);


--
-- Name: idx_dkp_ads_status_credits; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dkp_ads_status_credits ON public.dkp_ads USING btree (status, budget_credits);


--
-- Name: idx_user_xp_transactions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_xp_transactions_user_id ON public.user_xp_transactions USING btree (user_id);


--
-- Name: dkp_ads trg_dkp_ads_modtime; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dkp_ads_modtime BEFORE UPDATE ON public.dkp_ads FOR EACH ROW EXECUTE FUNCTION public.update_dkp_ads_timestamp();


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: api_keys api_keys_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: api_logs api_logs_api_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_logs
    ADD CONSTRAINT api_logs_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES public.api_keys(id) ON DELETE CASCADE;


--
-- Name: blog_posts blog_posts_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: blog_posts blog_posts_category_id_blog_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_category_id_blog_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.blog_categories(id) ON DELETE SET NULL;


--
-- Name: blog_posts blog_posts_subcategory_id_blog_subcategories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_subcategory_id_blog_subcategories_id_fk FOREIGN KEY (subcategory_id) REFERENCES public.blog_subcategories(id) ON DELETE SET NULL;


--
-- Name: blog_subcategories blog_subcategories_category_id_blog_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blog_subcategories
    ADD CONSTRAINT blog_subcategories_category_id_blog_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.blog_categories(id) ON DELETE CASCADE;


--
-- Name: bounties bounties_claimed_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bounties
    ADD CONSTRAINT bounties_claimed_by_users_id_fk FOREIGN KEY (claimed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: comments comments_post_id_posts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: dkp_crawler_licenses dkp_crawler_licenses_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dkp_crawler_licenses
    ADD CONSTRAINT dkp_crawler_licenses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: jobs jobs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: licenses licenses_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: posts posts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: pulse_chat_messages pulse_chat_messages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pulse_chat_messages
    ADD CONSTRAINT pulse_chat_messages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: pulse_user_xp pulse_user_xp_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pulse_user_xp
    ADD CONSTRAINT pulse_user_xp_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: vault_certs vault_certs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vault_certs
    ADD CONSTRAINT vault_certs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: votes votes_post_id_posts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.votes
    ADD CONSTRAINT votes_post_id_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: xp_transactions xp_transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions
    ADD CONSTRAINT xp_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict FH8UgYxFcloRfJfKPFU4SzT3qyDTjN7XbzxsjJGiegENOxmW7zCBh3MXEH4tL8j

