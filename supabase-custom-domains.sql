-- ================================================
-- CUSTOM DOMAINS FEATURE - DATABASE MIGRATION
-- ================================================

-- Step 1: Create custom_domains table
CREATE TABLE IF NOT EXISTS custom_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,  -- Link to authorized_users
    
    -- Domain configuration
    subdomain TEXT,  -- e.g., "go" (null for apex domain)
    domain TEXT NOT NULL,  -- e.g., "hey.com"
    full_domain TEXT UNIQUE NOT NULL,  -- e.g., "go.hey.com" or "hey.com"
    
    -- Verification
    verification_status TEXT DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'verified', 'failed')),
    verification_token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
    last_verified_at TIMESTAMPTZ,
    
    -- SSL
    ssl_status TEXT DEFAULT 'pending'
        CHECK (ssl_status IN ('pending', 'active', 'failed', 'expired')),
    ssl_issued_at TIMESTAMPTZ,
    ssl_expires_at TIMESTAMPTZ,
    
    -- Settings
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_domain UNIQUE (user_email, full_domain)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_domains_user ON custom_domains(user_email);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON custom_domains(verification_status);
CREATE INDEX IF NOT EXISTS idx_custom_domains_full_domain ON custom_domains(full_domain);

-- Step 2: Add user tier column to authorized_users table
ALTER TABLE authorized_users
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free' 
    CHECK (tier IN ('free', 'pro', 'enterprise'));

-- Step 3: Update files table to support custom domains
ALTER TABLE files
ADD COLUMN IF NOT EXISTS custom_domain_id UUID REFERENCES custom_domains(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- If custom_domain_id is NULL, use default domain (doc.sentio.ltd)

-- Step 4: Add comments for documentation
COMMENT ON TABLE custom_domains IS 'Stores user custom domains for link branding';
COMMENT ON COLUMN custom_domains.full_domain IS 'Complete domain or subdomain (e.g., go.hey.com)';
COMMENT ON COLUMN custom_domains.verification_token IS 'Unique token for DNS TXT record verification';
COMMENT ON COLUMN authorized_users.tier IS 'User subscription tier: free (0 domains), pro (50 domains), enterprise (500 domains)';
COMMENT ON COLUMN files.custom_domain_id IS 'Links to custom domain used for this file. NULL = default domain';

-- Step 5: Set existing users to 'pro' tier (for testing)
-- Change this after launch to 'free'
UPDATE authorized_users SET tier = 'pro' WHERE tier IS NULL;
