#!/bin/bash
set -e

python3 - << 'PYEOF'
path = "app/(app)/layout.tsx"
with open(path, "r") as f:
    content = f.read()

old = """  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // LOG TEMPORÁRIO DE DEBUG — remover depois de identificar o problema
  console.log('DEBUG user.id:', user.id)
  console.log('DEBUG profile:', profile)
  console.log('DEBUG profileError:', profileError)"""

new = """  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()"""

if old not in content:
    print("AVISO: log de debug não encontrado (talvez já tenha sido removido).")
else:
    content = content.replace(old, new)
    with open(path, "w") as f:
        f.write(content)
    print("Log de debug removido com sucesso.")
PYEOF
