import os
import click
import subprocess
import webbrowser
import socket
from contextlib import closing
from .TemporaryDirectory import TemporaryDirectory


@click.group()
def neurosift():
    pass


@click.command()
@click.argument('file', type=click.Path(exists=True))
def view_nwb(file):
    abs_fname = os.path.abspath(file)
    base_fname = os.path.basename(abs_fname)
    with TemporaryDirectory(prefix="view_nwb") as tmpdir:
        # create a symbolic link to the file
        os.symlink(abs_fname, f'{tmpdir}/{base_fname}')

        # this directory
        this_directory = os.path.dirname(os.path.realpath(__file__))

        # apparently shell=True is necessary for Windows, but shell=False is necessary for Linux
        if os.name == 'nt':
            shell = True
        elif os.name == 'posix':
            shell = False
        else:
            print(f'Warning: unrecognized os.name: {os.name}')
            shell = False

        try:
            npm_version = subprocess.run(["npm", "--version"], stdout=subprocess.PIPE, universal_newlines=True, shell=shell).stdout.strip()
            print(f'npm version: {npm_version}')
        except Exception:
            raise Exception('Unable to run npm.')

        try:
            node_version = subprocess.run(["node", "--version"], stdout=subprocess.PIPE, universal_newlines=True, shell=shell).stdout.strip()
            print(f'node version: {node_version}')
        except Exception:
            raise Exception('Unable to run node.')

        # parse node_version v18.0.0 to get the major version number
        node_major_version = int(node_version.split('.')[0][1:])
        if node_major_version < 16:
            raise Exception('node version must be >= 16.0.0')

        # run the command npm install in the js directory
        subprocess.run(["npm", "install"], cwd=f'{this_directory}/experimental-local-file-access', shell=shell)

        # find an open port
        port = find_free_port()

        # run the service
        process = subprocess.Popen(['npm', 'run', 'start', tmpdir], cwd=f'{this_directory}/experimental-local-file-access', shell=shell, env=dict(os.environ, PORT=str(port)))

        # open the browser
        url = f"https://flatironinstitute.github.io/neurosift/?p=/nwb&url=http://localhost:{port}/files/{base_fname}"
        print(f'Opening {url}')
        webbrowser.open(url)

        # wait for the process to finish
        process.wait()


def find_free_port():
    with closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as s:
        s.bind(('', 0))
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return s.getsockname()[1]


# Add command to the neurosift group
neurosift.add_command(view_nwb)


if __name__ == '__main__':
    neurosift()
