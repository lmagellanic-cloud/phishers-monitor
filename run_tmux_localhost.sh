#!/bin/bash
# set -x #echo on
RESET='\033[0m'
GREEN="\033[32m"
YELLOW="\033[33m"
MAGENTA="\033[35m"
CYAN='\033[0;36m'
echo -e "${MAGENTA}Script executed from '${PWD}' ${RESET}"

BASEDIR=$(dirname $0)
SCRIPT_FILENAME=$(basename "$0")
echo -e "${MAGENTA}Script name: '${SCRIPT_FILENAME}' ${RESET}"
echo -e "${MAGENTA}Script location: '${BASEDIR}' ${RESET}"

# TMUX
SESSION_NAME="phishers-monitor"
WINDOW_NAME="tmux-phishers-monitor-window"

echo -e "${CYAN}Creando sesión de tmux... ${RESET}"
tmux new-session -d -s $SESSION_NAME -n $WINDOW_NAME
# Partimos verticalmente la ventana de tmux creada
tmux split-window -h -t $SESSION_NAME:$WINDOW_NAME

echo -e "${CYAN}tmux para Django y activando venv... ${RESET}"
DJANGO_PANE="$SESSION_NAME:$WINDOW_NAME.0"
tmux send-keys -t $DJANGO_PANE "cd $BASEDIR && source venv/bin/activate" C-m
tmux send-keys -t $DJANGO_PANE "python3 ./django_backend/manage.py runserver 8080" C-m

echo -e "${CYAN}tmux para servidor React... ${RESET}"
REACT_PANE="$SESSION_NAME:$WINDOW_NAME.1"
tmux send-keys -t $REACT_PANE "cd $BASEDIR/react_frontend/ && npm run dev" C-m

echo -e "${CYAN}Establecida sesión tmux '$SESSION_NAME'. Entrando... ${RESET}"
tmux attach-session -t $SESSION_NAME

echo -e "${GREEN}Script finalizado. Terminado. ${RESET}"
