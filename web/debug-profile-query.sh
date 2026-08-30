#!/bin/bash
set -e

echo "Adicionando log de debug em app/(app)/layout.tsx..."
python3 - << 'PYEOF'
import re

path = "app/(app)/layout.tsx"
with open(path, "r") as f:
    content = f.read()

old = """  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()"""

new = """  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // LOG TEMPORÁRIO DE DEBUG — remover depois de identificar o problema
  console.log('DEBUG user.id:', user.id)
  console.log('DEBUG profile:', profile)
  console.log('DEBUG profileError:', profileError)"""

if old not in content:
    print("AVISO: trecho original não encontrado, arquivo pode já estar diferente do esperado.")
else:
    content = content.replace(old, new)
    with open(path, "w") as f:
        f.write(content)
    print("Log adicionado com sucesso.")
PYEOF

echo "Pronto."
