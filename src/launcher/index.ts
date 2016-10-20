// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Token
} from 'phosphor/lib/core/token';

import {
  JSONObject
} from 'phosphor/lib/algorithm/json';

import {
  DisposableDelegate, IDisposable
} from 'phosphor/lib/core/disposable';

import {
  h, VNode
} from 'phosphor/lib/ui/vdom';

import {
  JupyterLab
} from '../application';

import {
  VDomModel, VDomWidget
} from '../common/vdom';

/* tslint:disable */
/**
 * The launcher token.
 */
export
const ILauncher = new Token<ILauncher>('jupyter.services.launcher');
/* tslint:enable */


/**
 * The class name added to LauncherWidget instances.
 */
const LAUNCHER_CLASS = 'jp-LauncherWidget';

/**
 * The class name added to LauncherWidget image nodes.
 */
const IMAGE_CLASS = 'jp-LauncherWidget-image';

/**
 * The class name added to LauncherWidget text nodes.
 */
const TEXT_CLASS = 'jp-LauncherWidget-text';

/**
 * The class name added to LauncherWidget column nodes.
 */
const COLUMN_CLASS = 'jp-LauncherWidget-column';

/**
 * The class name added to LauncherWidget folder node.
 */
const FOLDER_CLASS = 'jp-LauncherWidget-folder';

/**
 * The class name added to LauncherWidget path nodes.
 */
const PATH_CLASS = 'jp-LauncherWidget-path';

/**
 * The class name added to LauncherWidget current working directory node.
 */
const CWD_CLASS = 'jp-LauncherWidget-cwd';

/**
 * The class name added to LauncherWidget body nodes.
 */
const BODY_CLASS = 'jp-LauncherWidget-body';

/**
 * The class name added to LauncherWidget dialog node.
 */
const DIALOG_CLASS = 'jp-LauncherWidget-dialog';


/**
 * The launcher interface.
 */
export
interface ILauncher {
  /**
   * Add a command item to the Launcher, and trigger re-render event for parent
   * widget.
   *
   * @param name - The display name.
   *
   * @param action - The command that should be executed on clicking.
   *
   * @param args - Arguments to the `action` command.
   *
   * @param imgName - The CSS class to attach to the item. Defaults to
   * 'jp-Image' followed by the `name` with spaces removed. So if the name is
   * 'Launch New Terminal' the class name will be 'jp-ImageLaunchNewTerminal'.
   *
   * @returns A disposable that will remove the item from Launcher, and trigger
   * re-render event for parent widget.
   *
   */
  add(name: string, action: string, args?: JSONObject, imgName?: string): IDisposable ;
}


/**
 * Simple encapsulation of name and callback of launcher entries. This is an
 * implementation detail of the LauncherModel. You should not need to use
 * this class directly, but use the `LauncherModel.add` method instead.
 */
export
class LauncherItem {

  readonly name: string;

  readonly clickCallback: () => void;

  readonly imgName: string;

  /**
   * Construct a new launcher item.
   */
  constructor(name: string, clickCallback: () => void, imgName?: string) {
    this.name = name;
    this.clickCallback = clickCallback;
    if (imgName) {
      this.imgName = imgName;
    } else {
      this.imgName = 'jp-Image' + name.replace(/\ /g, '');
    }
  }
}


/**
 * LauncherModel keeps track of the path to working directory and has a list of
 * LauncherItems, which the LauncherWidget will render.
 */
export
class LauncherModel extends VDomModel implements ILauncher {
  items: LauncherItem[] = [];

  add(name: string, action: string, args?: JSONObject, imgName?: string) : IDisposable {
    let clickCallback = () => { this.app.commands.execute( action, args); };
    let item = new LauncherItem(name, clickCallback, imgName);
    this.items.push(item);
    this.stateChanged.emit(void 0);

    return new DisposableDelegate(() => {
      // Remove the item from the list of items.
      let index = this.items.indexOf(item, 0);
      if (index > -1) {
          this.items.splice(index, 1);
          this.stateChanged.emit(void 0);
      }
    });
  }

  /**
   * The path to the current working directory.
   */
  get path(): string {
    return this._path;
  }
  set path(path: string) {
    this._path = path;
    this.stateChanged.emit(void 0);
  }

  /**
   * The JupyterLab application this launcher will use when executing
   * commands.
   */
  get app() : JupyterLab {
    return this._app;
  }
  set app(app: JupyterLab) {
    this._app = app;
  }
  private _path: string = 'home';
  private _app: JupyterLab;
}


/**
 * A virtual-DOM-based widget for the Launcher.
 */
export
class LauncherWidget extends VDomWidget<LauncherModel> {

  /**
   * Construct a new launcher widget.
   */
  constructor() {
    super();
    this.addClass(LAUNCHER_CLASS);
  }

  /**
   * Render the launcher to virtual DOM nodes.
   */
  protected render(): VNode | VNode[] {
    let children : VNode[] = [];

    for (let item of this.model.items) {
      let img = h.span({className: item.imgName + ' ' + IMAGE_CLASS});
      let text = h.span({className:  TEXT_CLASS }, item.name);

      let column = h.div({
        className: COLUMN_CLASS,
        'onclick': item.clickCallback
      }, [img, text]);
      children.push(column);
    }

    let folderImage = h.span({ className: FOLDER_CLASS });
    let p = this.model.path;
    let pathName = p.length ? 'home > ' + p.replace(/\//g, ' > ') : 'home';
    let path = h.span({ className: PATH_CLASS }, pathName );

    let cwd = h.div({ className: CWD_CLASS }, [folderImage, path]);
    let body = h.div({ className: BODY_CLASS  }, children);

    return h.div({ className: DIALOG_CLASS}, [ cwd, body ]);

  }
}