import argparse
import datetime as dt
import pathlib
import subprocess
import sys
import threading
from pathlib import Path
from typing import Annotated

import cmd2
from cmd2 import Color, stylize, with_category
from cmd2.annotated import Option
from prompt_toolkit.application import get_app
from prompt_toolkit.formatted_text import AnyFormattedText
from rich.style import Style
from rich.text import Text

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MANAGE_PY = PROJECT_ROOT / "django_backend" / "manage.py"
MEDIA_DIR = PROJECT_ROOT / "django_backend" / "media"
DJANGO_SCRIPTS = PROJECT_ROOT / "django_backend" / "scripts"


class DjangoCLI(cmd2.Cmd):
    """DjangoCLI"""

    DEFAULT_CATEGORY = "Built-in Commands"

    def __init__(self) -> None:
        """Initialize the cmd2 application."""
        # Startup script that defines a couple aliases for running shell commands
        alias_script = pathlib.Path(__file__).absolute().parent / ".cmd2rc"

        # Create a shortcut for one of our commands
        shortcuts = cmd2.DEFAULT_SHORTCUTS
        shortcuts.update({"&": "intro"})

        super().__init__(
            auto_suggest=True,
            enable_bottom_toolbar=True,
            enable_rprompt=True,
            include_ipy=True,
            persistent_history_file="cmd2_history.dat",
            refresh_interval=0.5,  # refresh the UI twice a second to keep the bottom toolbar timestamp current
            shortcuts=shortcuts,
            startup_script=str(alias_script),
        )

        # Prints an intro banner once upon application startup
        self.intro = stylize(
            "Welcome to Django's CLI!",
            style=Style(color=Color.GREEN1, bgcolor=Color.GRAY0, bold=True),
        )

        # Show this as the prompt when asking for input
        self.prompt = "django_cli> "

        # Allow access to your application in py and ipy via self
        self.self_in_py = True

        # Color to output text in with echo command
        self.foreground_color = Color.CYAN.value

        # Used as prompt for multiline commands after the firts line
        self.continuation_prompt = "..."

        # Make foreground_color settable at runtime
        fg_colors = [c.value for c in Color]
        self.add_settable(
            cmd2.Settable(
                "foreground_color",
                str,
                Text.assemble(
                    "Foreground color to use with echo command ",
                    "(Options: ",
                    Text("Green", Style(color=Color.GREEN)),
                    ", ",
                    Text("Red", Style(color=Color.RED)),
                    ", ",
                    Text("Blue", Style(color=Color.BLUE)),
                    ", ...)",
                ),
                self,
                choices=fg_colors,
            )
        )

        # Initialize background thread state for the bottom toolbar
        self._toolbar_state = {"now": ""}
        self._toolbar_lock = threading.Lock()
        self._stop_thread_event = threading.Event()
        self._toolbar_thread: threading.Thread | None = None

    def _update_toolbar_state(self) -> None:
        """Background thread worker to update toolbar state continuously."""
        while not self._stop_thread_event.is_set():
            # Get the current time in ISO format with 0.01s precision
            now_dt = dt.datetime.now(dt.UTC).astimezone()
            now_str = now_dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-4] + now_dt.strftime(
                "%z"
            )

            with self._toolbar_lock:
                self._toolbar_state["now"] = now_str

            # Sleep to yield CPU, polling 4 times a second
            self._stop_thread_event.wait(0.25)

    def preloop(self) -> None:
        """Hook method executed once when the cmdloop() method is called."""
        self._stop_thread_event.clear()
        self._toolbar_thread = threading.Thread(
            target=self._update_toolbar_state, daemon=True
        )
        self._toolbar_thread.start()

    def postloop(self) -> None:
        """Hook method executed once when the cmdloop() method is about to return."""
        if self._toolbar_thread and self._toolbar_thread.is_alive():
            self._stop_thread_event.set()
            self._toolbar_thread.join()

    def get_bottom_toolbar(self) -> AnyFormattedText:
        left_text = sys.argv[0]

        with self._toolbar_lock:
            now = self._toolbar_state.get("now", "")

        # Fetch the terminal width to calculate padding for right-alignment.
        # If called outside a running app loop (e.g., in unit tests), get_app()
        # safely returns a dummy app with an 80-column fallback.
        cols = get_app().output.get_size().columns
        padding_size = cols - len(left_text) - len(now)
        padding_size = max(padding_size, 1)
        padding = " " * padding_size

        # Return formatted text for prompt-toolkit
        return [
            ("ansigreen", left_text),
            ("", padding),
            ("ansicyan", now),
        ]

    def get_rprompt(self) -> AnyFormattedText:
        current_working_directory = pathlib.Path.cwd()
        style = "bg:ansired fg:ansiwhite"
        text = f"cwd={current_working_directory}"
        return [(style, text)]

    @cmd2.with_annotated
    def do_cat(
        self,
        path: pathlib.Path,  # Required positional argument with type annotation, tab-completes filesystem paths automatically
        numbered: Annotated[  # Optional flag argument with type annotation, default value, and help text
            bool, Option("-n", "--number", help_text="prefix each line with its number")
        ] = False,
    ) -> None:
        """Print a file's contents. `path` tab-completes filesystem paths automatically.

        Try:
            cat <TAB>              # path completes files/dirs -- no completer wired
            cat notes.txt
            cat notes.txt -n       # -n / --number, declared via Option metadata
            cat notes.txt --no-number
        """
        text = path.read_text()
        lines = text.splitlines()
        if numbered:
            numbered_lines = []
            for index, line in enumerate(lines, start=1):
                numbered_lines.append(f"{index}: {line}")
            self.ppaged("\n".join(numbered_lines))
        else:
            # Just print the contents using a pager
            self.ppaged(path.read_text())

    def do_intro(self, _: cmd2.Statement) -> None:
        """Display the intro banner.

        This command uses raw statement parsing. In general, we strongly recommend against this approach. But since this
        command effectively takes no arguments, it is safe to use raw statement parsing here.

        The & key is also used as a shortcut for this command, so you can also type & to display the intro banner.
        """
        self.poutput(self.intro)

    @staticmethod
    def _build_echo_parser() -> cmd2.Cmd2ArgumentParser:
        """Parser factory method for use with the echo command."""
        echo_parser = cmd2.Cmd2ArgumentParser(description="Command that echoes input.")
        echo_parser.add_argument(
            "-u", "--upper", action="store_true", help="uppercase the output"
        )
        echo_parser.add_argument(
            "-r", "--repeat", type=int, default=1, help="output [n] times"
        )
        echo_parser.add_argument("words", nargs="+", help="words to print")
        return echo_parser

    @cmd2.with_argparser(_build_echo_parser)
    def do_echo(self, args: argparse.Namespace) -> None:
        """Command using with_argparser decorator for parsing arguments."""
        output_str = " ".join(args.words)
        if args.upper:
            output_str = output_str.upper()

        for _ in range(args.repeat):
            self.poutput(
                stylize(
                    output_str,
                    style=Style(color=self.foreground_color),
                )
            )

    @with_category("Django utilities")
    def do_django_shell(self, line):
        """Para acceder al terminal de Django"""
        subprocess.run([sys.executable, str(MANAGE_PY), "shell"], check=False)

    @with_category("Django utilities")
    def do_make_migrations(self, line):
        """python manage.py make migrations"""
        subprocess.run([sys.executable, str(MANAGE_PY), "makemigrations"], check=False)

    @with_category("Django utilities")
    def do_migrate(self, line):
        """python manage.py migrate"""
        subprocess.run([sys.executable, str(MANAGE_PY), "migrate"], check=False)

    @with_category("Django utilities")
    def do_list_scripts(self, line):
        self.poutput("Listado de scripts:")
        for script_filename in DJANGO_SCRIPTS.glob("*"):
            self.poutput(f"\t- {script_filename.name}")

    @with_category("Django utilities")
    def do_generate_random_json_files(self, line):
        """Lanzador para ejecutar generate_random_json_files.py"""
        self.poutput("Ejecutando 'generate_random_json_files.py'")
        subprocess.run(
            [sys.executable, "generate_random_json_files.py"],
            cwd=DJANGO_SCRIPTS,
            check=False,
        )

    @with_category("Django utilities")
    def do_populate_database(self, line):
        """Lanzador para ejecutar populate_database.py"""
        self.poutput("Ejecutando 'populate_database.py'")
        subprocess.run(
            [sys.executable, str(MANAGE_PY), "populate_database"], check=False
        )

    @with_category("Django utilities")
    def do_empty_database(self, line):
        """Lanzador para ejecutar empty_database.py"""
        self.poutput("Ejecutando 'empty_database.py'")
        subprocess.run([sys.executable, str(MANAGE_PY), "empty_database"], check=False)


if __name__ == "__main__":
    app = DjangoCLI()
    sys.exit(app.cmdloop())
