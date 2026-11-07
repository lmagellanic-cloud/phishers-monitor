import argparse
import datetime
import json
import pathlib
import random
from random import randrange

WORKING_DIR = pathlib.Path(__file__).parent
MEDIA_FOLDER = WORKING_DIR / "../media"

# Condiciones iniciales
IS_MARKOV_MATRIX = True
ARRAY_DIMENSION = 4
SIGMA = 0.01


class bcolors:  # TODO: Poner común para todos
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"


def __init_argparse():
    parser = argparse.ArgumentParser(
        description="Generate random monitored-user JSON files."
    )
    parser.add_argument(
        "--output-dir",
        type=pathlib.Path,
        default=MEDIA_FOLDER,
        help="Directory where generated JSON files are written.",
    )
    args = parser.parse_args()
    return args


def print_array_on_terminal(array, colorCode):
    consola = str(array)
    consola = consola.replace(", [", "\n")
    consola = consola.strip("[")
    consola = consola.strip("]")
    consola = consola.replace("]\n", "\n")
    print("\033[" + colorCode + "m" + consola + "\033[0m")


def check_param_boundaries(inputNum):
    if (isinstance(inputNum, int)) and (inputNum > 0):
        return inputNum
    else:
        print("Un argumento introducido no es válido")
        return 5


def generate_stocastic_matrix() -> list:
    """Generate stocastics matrix. Only to N-1

    Returns:
        list: array
    """
    # Se inicializara una matriz de (N+1)x(N+1) para situar en los bordes la suma de las filas y columnas
    stocastic_array = [
        [1 for x in range(ARRAY_DIMENSION + 1)] for y in range(ARRAY_DIMENSION + 1)
    ]
    for i in range(ARRAY_DIMENSION):
        for j in range(ARRAY_DIMENSION):
            # Rellena de manera aleatoria la matriz hasta (N-1)x(N-1)
            # El borde (N+1)x(N+1) es sólo para ajustar m.estocástica
            if j == ARRAY_DIMENSION - 1:
                stocastic_array[i][j] = stocastic_array[i][ARRAY_DIMENSION]
                stocastic_array[i][ARRAY_DIMENSION] -= stocastic_array[i][j]
            else:
                temp = stocastic_array[i][ARRAY_DIMENSION]
                stocastic_array[i][j] = random.uniform(0, temp)
                stocastic_array[i][ARRAY_DIMENSION] -= stocastic_array[i][j]

    print(stocastic_array)
    return stocastic_array


def armonize_stocastic_matrix(
    matrix: list, matrix_dim: int, row_pos: int, column_pos: int
) -> list:
    """Elimina elementos negativos en el matrix

    Args:
        matrix (list): Todo el array pasado como parámetro
        matrix_dim (int): Dimensión de la matriz
        row_pos (_type_): La fila en el que está colocado el elemento negativo
        column_pos (_type_): La columna en el que está colocado el elemento negativo

    Returns:
        list: Array/Matrix
    """
    print("Matriz antes de corregirse")
    print_array_on_terminal(matrix, "94")
    borde = matrix_dim - 1
    maximo = 0
    correccionLocal = 0

    # Alterar la ultima columna para luego alterar las filas
    if column_pos == borde:
        corregirValor = matrix[row_pos][column_pos]
        corregirValor = abs(corregirValor)
        print(
            "\033[93m"
            + "CASO COLUMNA U. corregirValor es: "
            + str(corregirValor)
            + "\033[0m"
            + "\n"
        )
        print(
            "\033[93m" + "CASO COLUMNA U. maximo es: " + str(maximo) + "\033[0m" + "\n"
        )
        matrix[row_pos][column_pos] = (
            matrix[row_pos][column_pos] + corregirValor
        )  # Corregimos elemento negativo, se espera que dé cero
        corregirValor = corregirValor / (matrix_dim - 1)
        # Modificamos las columnas afectadas por el cambio anterior, para que sigan sumando uno
        for i in range(matrix_dim - 1):
            if matrix[row_pos][i] - corregirValor >= 0:
                matrix[row_pos][i] = (
                    matrix[row_pos][i] - corregirValor
                )  # Compensamos la columna del elemento negativo
                if (matrix[row_pos][i] - correccionLocal >= 0) and (
                    correccionLocal != 0
                ):
                    matrix[row_pos][i] = matrix[row_pos][i] - correccionLocal
                    correccionLocal = 0
            else:
                correccionLocal += corregirValor
    print("Matriz después de corregirse")
    print_array_on_terminal(matrix, "95")
    print("\n")
    return matrix


# Comprobacion que es matriz estocástica
def check_stotastic_matrix(matrix):
    row_sum = 0
    for i in range(ARRAY_DIMENSION):
        for j in range(ARRAY_DIMENSION):
            row_sum += matrix[i][j]
        print("Fila " + str(i + 1) + " suma " + str(row_sum))
        row_sum = 0


def generate_user_activity(matrix: list, sigma: float):
    """Generar matriz con el que un usuario activo está realizando actividad en la navegación web
    Simulación del usuario en la navegación web. Define la sigma si (sigma < 0.01) para actividad normal,
    (sigma > 0.1) para actividad de pishing

    Args:
        matrix (list): Stocastic Matrix
        sigma (float): Sigma deviation

    Returns:
        list: User's activity matrix
    """
    user_activity_matrix = [
        [1 for x in range(ARRAY_DIMENSION + 1)] for y in range(ARRAY_DIMENSION + 1)
    ]
    for i in range(ARRAY_DIMENSION):
        for j in range(ARRAY_DIMENSION):
            # Rellena de manera aleatoria la matriz hasta (N-1)x(N-1)
            # El borde (N+1)x(N+1) es sólo para ajustar m.estocástica
            if j == ARRAY_DIMENSION - 1:
                user_activity_matrix[i][j] = user_activity_matrix[i][ARRAY_DIMENSION]
                user_activity_matrix[i][ARRAY_DIMENSION] -= user_activity_matrix[i][j]
            else:
                mu = matrix[i][j]
                nominal_value = random.gauss(mu, sigma)
                if nominal_value < 0:
                    nominal_value = abs(nominal_value)
                if nominal_value > 1:
                    nominal_value = nominal_value - 1
                    nominal_value = 1 - nominal_value
                user_activity_matrix[i][j] = nominal_value
                user_activity_matrix[i][ARRAY_DIMENSION] -= user_activity_matrix[i][j]

    print(user_activity_matrix)
    return user_activity_matrix


def generate_random_json_files(
    user_counts: int, array_counts: int, output_dir: pathlib.Path = MEDIA_FOLDER
) -> list[pathlib.Path]:
    """Genera ficheros JSON, con el nombre de usuario como nombre de fichero

    Args:
        user_counts (int): Número de usuarios (número de ficheros) a generar
        output_dir (pathlib.Path): Directorio donde se generarán los ficheros JSON
        array_counts (int): Número de matrices (par de modelo y actividad)
    """
    json_file_paths = []
    for user in range(user_counts):
        username = f"user_{user}"
        user_json_path = output_dir.joinpath(f"{username}.json")
        json_file_paths.append(user_json_path)

        # User data
        json_content = {}
        json_content["user"] = username
        timestamp_now = datetime.datetime.now()
        json_content["user_info"] = {
            "active": randrange(0, 2) >= 1,
            "json_timestamp": str(timestamp_now),
            "json_timestamp_epoch": timestamp_now.timestamp(),
            "json_timestamp_epoch_info": "json_timestamp_epoch is the time in milliseconds since the epoch as a floating point number. Epoch is designed to be January 1, 1970, 00:00:00 (UTC)",
        }

        # Bucle para escribir todos los modelos generados al fichero JSON
        for array_i in range(array_counts):
            # Generamos matriz estocástica para array_i
            stocastic_array = generate_stocastic_matrix()

            # Comprobación
            print("Comprobando matriz estocástica")
            check_stotastic_matrix(stocastic_array)

            # Append user model data
            user_model_data_name = f"modelUserData_{array_i}"
            json_content[user_model_data_name] = stocastic_array

            # Append user activity data
            user_activity_data_name = f"activityUserData_{array_i}"
            json_content[user_activity_data_name] = generate_user_activity(
                stocastic_array, SIGMA
            )

        # Writes to JSON file
        print(f"{bcolors.FAIL}{json_content}{bcolors.ENDC}")
        with open(user_json_path, "w") as fp:
            print(f"Escribiendo fichero en {user_json_path}")
            json.dump(json_content, fp, indent=4)

    # Devolver ruta de los ficheros generados
    return json_file_paths


def main():
    args = __init_argparse()

    if args.output_dir:
        assert args.output_dir, f"No existe directorio {args.output_dir}"

    user_counts = int(input("Introduce el numero de usuarios deseados >> "))
    user_counts = check_param_boundaries(user_counts)
    ARRAY_COUNTS = randrange(3, 10)

    generate_random_json_files(user_counts, ARRAY_COUNTS, args.output_dir)


if __name__ == "__main__":
    main()
