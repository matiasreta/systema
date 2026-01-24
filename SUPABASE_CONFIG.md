# Configuración de Base de Datos Supabase - Systema

Esta guía detalla cómo configurar Supabase para el sistema de hábitos.

---

## 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Guarda las credenciales:
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon Key**: `eyJ...`
   - **Service Role Key**: (solo para backend)

---

## 2. Esquema de Base de Datos

### Tabla: `habits`

```sql
CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_time INTEGER NOT NULL CHECK (start_time >= 0 AND start_time < 1440),
  end_time INTEGER NOT NULL CHECK (end_time > 0 AND end_time <= 1440),
  expected_duration INTEGER GENERATED ALWAYS AS (end_time - start_time) STORED,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  active_days JSONB NOT NULL DEFAULT '{"monday":true,"tuesday":true,"wednesday":true,"thursday":true,"friday":true,"saturday":true,"sunday":true}',
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Índices
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_active ON habits(user_id, is_active);
```

### Tabla: `daily_records`

```sql
CREATE TABLE daily_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  actual_start_time INTEGER,
  actual_end_time INTEGER,
  actual_duration INTEGER GENERATED ALWAYS AS (
    CASE WHEN actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL 
    THEN actual_end_time - actual_start_time 
    ELSE 0 END
  ) STORED,
  completion_rate DECIMAL(3,2) DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 1),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_habit_per_day UNIQUE (habit_id, date),
  CONSTRAINT valid_actual_time CHECK (
    (actual_start_time IS NULL AND actual_end_time IS NULL) OR
    (actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL AND actual_start_time < actual_end_time)
  )
);

-- Índices
CREATE INDEX idx_records_user_date ON daily_records(user_id, date);
CREATE INDEX idx_records_habit ON daily_records(habit_id);
CREATE INDEX idx_records_date_range ON daily_records(date DESC);
```

### Vista: `habit_stats` (estadísticas calculadas)

```sql
CREATE OR REPLACE VIEW habit_stats AS
WITH recent_records AS (
  SELECT 
    h.id as habit_id,
    h.user_id,
    dr.date,
    dr.completion_rate,
    h.active_days
  FROM habits h
  LEFT JOIN daily_records dr ON h.id = dr.habit_id 
    AND dr.date >= CURRENT_DATE - INTERVAL '100 days'
  WHERE h.is_active = true
),
streaks AS (
  SELECT 
    habit_id,
    user_id,
    COUNT(*) FILTER (WHERE completion_rate >= 0.8) as completed_days,
    AVG(completion_rate) * 100 as rolling_100_days
  FROM recent_records
  GROUP BY habit_id, user_id
)
SELECT 
  habit_id,
  user_id,
  COALESCE(rolling_100_days, 0) as rolling_100_days,
  COALESCE(completed_days, 0) as total_completed_days
FROM streaks;
```

---

## 3. Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

-- Políticas para habits
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para daily_records
CREATE POLICY "Users can view own records" ON daily_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own records" ON daily_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" ON daily_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" ON daily_records
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 4. Funciones Útiles

### Verificar solapamiento de hábitos

```sql
CREATE OR REPLACE FUNCTION check_habit_overlap(
  p_user_id UUID,
  p_start_time INTEGER,
  p_end_time INTEGER,
  p_active_days JSONB,
  p_exclude_habit_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  has_overlap BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM habits
    WHERE user_id = p_user_id
      AND is_active = true
      AND id != COALESCE(p_exclude_habit_id, '00000000-0000-0000-0000-000000000000')
      AND start_time < p_end_time
      AND end_time > p_start_time
      AND (
        (active_days->>'monday')::boolean AND (p_active_days->>'monday')::boolean OR
        (active_days->>'tuesday')::boolean AND (p_active_days->>'tuesday')::boolean OR
        (active_days->>'wednesday')::boolean AND (p_active_days->>'wednesday')::boolean OR
        (active_days->>'thursday')::boolean AND (p_active_days->>'thursday')::boolean OR
        (active_days->>'friday')::boolean AND (p_active_days->>'friday')::boolean OR
        (active_days->>'saturday')::boolean AND (p_active_days->>'saturday')::boolean OR
        (active_days->>'sunday')::boolean AND (p_active_days->>'sunday')::boolean
      )
  ) INTO has_overlap;
  
  RETURN has_overlap;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Configuración en Next.js

### Instalar dependencia

```bash
npm install @supabase/supabase-js
```

### Variables de entorno

Crear `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Cliente Supabase

Crear `app/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 6. Tipos TypeScript Generados

Ejecutar para generar tipos automáticamente:

```bash
npx supabase gen types typescript --project-id tu-project-id > app/types/database.ts
```

---

## 7. Orden de Ejecución SQL

1. Crear tabla `habits`
2. Crear tabla `daily_records`
3. Crear vista `habit_stats`
4. Habilitar RLS y crear políticas
5. Crear función `check_habit_overlap`

> **Nota:** Ejecuta estos comandos en el SQL Editor de Supabase Dashboard.
