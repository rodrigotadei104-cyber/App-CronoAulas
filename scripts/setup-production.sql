-- =====================================================
-- CRONOAULAS - SETUP DE PRODUÇÃO
-- Script para configurar tenants e RLS
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CRIAR TABELAS DE TENANT
-- =====================================================

-- Tabela de Tenants (Escolas/Instituições)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Vínculos Usuário-Tenant
CREATE TABLE IF NOT EXISTS user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'VIEWER' CHECK (role IN ('TENANT_ADMIN', 'EDITOR', 'VIEWER')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);

-- =====================================================
-- 2. ADICIONAR COLUNA TENANT_ID NAS TABELAS EXISTENTES
-- =====================================================

ALTER TABLE aulas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE instrutores ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE cursos ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE materias ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- =====================================================
-- 3. CRIAR TENANT PADRÃO
-- =====================================================

INSERT INTO tenants (id, name, slug, active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'CronoAulas Principal',
  'cronoaulas-principal',
  true
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. REMOVER POLICIES ANTIGAS (SE EXISTIREM)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own tenant aulas" ON aulas;
DROP POLICY IF EXISTS "Users can insert aulas in own tenant" ON aulas;
DROP POLICY IF EXISTS "Editors can update aulas" ON aulas;
DROP POLICY IF EXISTS "Admins can delete aulas" ON aulas;

DROP POLICY IF EXISTS "Users can view own tenant instrutores" ON instrutores;
DROP POLICY IF EXISTS "Editors can manage instrutores" ON instrutores;

DROP POLICY IF EXISTS "Users can view own tenant cursos" ON cursos;
DROP POLICY IF EXISTS "Editors can manage cursos" ON cursos;

DROP POLICY IF EXISTS "Users can view own tenant materias" ON materias;
DROP POLICY IF EXISTS "Editors can manage materias" ON materias;

DROP POLICY IF EXISTS "Users can view own tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view own tenant links" ON user_tenants;

-- =====================================================
-- 6. CRIAR POLICIES PARA AULAS
-- =====================================================

-- SELECT: Usuário vê apenas aulas do seu tenant
CREATE POLICY "Users can view own tenant aulas"
ON aulas FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- INSERT: Usuário pode criar aulas no seu tenant
CREATE POLICY "Users can insert aulas in own tenant"
ON aulas FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants 
    WHERE user_id = auth.uid()
    AND role IN ('EDITOR', 'TENANT_ADMIN')
  )
);

-- UPDATE: Apenas EDITOR e TENANT_ADMIN podem editar
CREATE POLICY "Editors can update aulas"
ON aulas FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants 
    WHERE user_id = auth.uid() 
    AND role IN ('EDITOR', 'TENANT_ADMIN')
  )
);

-- DELETE: Apenas EDITOR e TENANT_ADMIN podem deletar
CREATE POLICY "Admins can delete aulas"
ON aulas FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants 
    WHERE user_id = auth.uid() 
    AND role IN ('EDITOR', 'TENANT_ADMIN')
  )
);

-- =====================================================
-- 7. CRIAR POLICIES PARA INSTRUTORES
-- =====================================================

CREATE POLICY "Users can view own tenant instrutores"
ON instrutores FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Editors can manage instrutores"
ON instrutores FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants 
    WHERE user_id = auth.uid() 
    AND role IN ('EDITOR', 'TENANT_ADMIN')
  )
);

-- =====================================================
-- 8. CRIAR POLICIES PARA CURSOS
-- =====================================================

CREATE POLICY "Users can view own tenant cursos"
ON cursos FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Editors can manage cursos"
ON cursos FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants 
    WHERE user_id = auth.uid() 
    AND role IN ('EDITOR', 'TENANT_ADMIN')
  )
);

-- =====================================================
-- 9. CRIAR POLICIES PARA MATERIAS
-- =====================================================

CREATE POLICY "Users can view own tenant materias"
ON materias FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Editors can manage materias"
ON materias FOR ALL
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants 
    WHERE user_id = auth.uid() 
    AND role IN ('EDITOR', 'TENANT_ADMIN')
  )
);

-- =====================================================
-- 10. CRIAR POLICIES PARA TENANTS
-- =====================================================

CREATE POLICY "Users can view own tenants"
ON tenants FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- 11. CRIAR POLICIES PARA USER_TENANTS
-- =====================================================

CREATE POLICY "Users can view own tenant links"
ON user_tenants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 12. FUNÇÃO HELPER: VINCULAR USUÁRIO AO TENANT PADRÃO
-- =====================================================

CREATE OR REPLACE FUNCTION link_user_to_default_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- Vincular novo usuário ao tenant padrão como TENANT_ADMIN
  INSERT INTO user_tenants (user_id, tenant_id, role)
  VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000001',
    'TENANT_ADMIN'
  )
  ON CONFLICT (user_id, tenant_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para auto-vincular novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_user_to_default_tenant();

-- =====================================================
-- 13. ATUALIZAR DADOS EXISTENTES (SE HOUVER)
-- =====================================================

-- Vincular dados existentes ao tenant padrão
UPDATE aulas SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE instrutores SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE cursos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE materias SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- =====================================================
-- 14. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar tabelas criadas
SELECT 'Tabela tenants criada' as status, COUNT(*) as registros FROM tenants;
SELECT 'Tabela user_tenants criada' as status, COUNT(*) as registros FROM user_tenants;

-- Verificar RLS habilitado
SELECT 
  schemaname, 
  tablename, 
  CASE WHEN rowsecurity THEN '✅ Habilitado' ELSE '❌ Desabilitado' END as rls_status
FROM pg_tables 
WHERE tablename IN ('tenants', 'user_tenants', 'aulas', 'instrutores', 'cursos', 'materias')
  AND schemaname = 'public'
ORDER BY tablename;

-- Verificar policies criadas
SELECT 
  tablename,
  policyname,
  cmd as operacao
FROM pg_policies
WHERE tablename IN ('tenants', 'user_tenants', 'aulas', 'instrutores', 'cursos', 'materias')
ORDER BY tablename, policyname;

-- =====================================================
-- CONCLUÍDO!
-- =====================================================
-- Próximos passos:
-- 1. Criar um usuário de teste via Supabase Auth
-- 2. O usuário será automaticamente vinculado ao tenant padrão
-- 3. Testar login na aplicação
-- =====================================================
