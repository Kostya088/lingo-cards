CREATE TABLE IF NOT EXISTS public.decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_language TEXT NOT NULL,
    native_language TEXT NOT NULL DEFAULT 'English',
    color TEXT NOT NULL DEFAULT 'emerald',
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    notes TEXT,
    level SMALLINT NOT NULL DEFAULT 0,
    consecutive_correct INT NOT NULL DEFAULT 0,
    interval_days INT NOT NULL DEFAULT 0,
    ease_factor NUMERIC(4,2) NOT NULL DEFAULT 2.50,
    next_review_date BIGINT NOT NULL,
    last_reviewed_date BIGINT,
    total_reviews INT NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own decks" ON public.decks;
CREATE POLICY "Users can manage own decks" ON public.decks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own cards" ON public.cards;
CREATE POLICY "Users can manage own cards" ON public.cards
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_decks_user_updated ON public.decks(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_cards_user_updated ON public.cards(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON public.cards(deck_id);
