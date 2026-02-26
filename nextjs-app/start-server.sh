#!/bin/bash
# Script para asegurar que el servidor siempre se ejecute en el puerto 3000

echo "🚀 Iniciando servidor en puerto 3000..."

# Terminar cualquier proceso en el puerto 3000
echo "🔧 Liberando puerto 3000..."
sudo fuser -k 3000/tcp 2>/dev/null || true
sleep 1

# Limpiar cache si es necesario
if [ "$1" == "clean" ]; then
    echo "🧹 Limpiando cache..."
    rm -rf .next
fi

# Iniciar el servidor
echo "✅ Iniciando Next.js en puerto 3000..."
npm run dev