/**
 * @name Experiments
 * @author programmer2514
 * @authorId 563652755814875146
 * @description Enables the Discord Experiments and Developer settings. DO NOT USE UNLESS YOU KNOW WHAT YOU ARE DOING - YOUR ACCOUNT COULD GET BANNED
 * @version 1.0.1
 * @donate https://ko-fi.com/benjaminpryor
 * @patreon https://www.patreon.com/BenjaminPryor
 * @website https://github.com/programmer2514/BetterDiscord-Experiments
 * @source https://github.com/programmer2514/BetterDiscord-Experiments/raw/refs/heads/main/Experiments.plugin.js
 */

const config = {
  changelog: [
    {
      title: '1.0.1',
      type: 'added',
      items: [
        'Added loading animation',
        'Fixed experiments not enabling immediately',
      ],
    },
    {
      title: '1.0.0',
      type: 'added',
      items: [
        'Initial release',
      ],
    },
  ],
};

const runtime = {
  meta: null,
  api: null,
  user: null,
};

const modules = {
  userStore: null,
  dispatcher: null,
  settings: null,
  layers: null,
};

const actions = {
  user: null,
  experiment: null,
  developer: null,
};

// Export plugin class
module.exports = class Experiments {
  // Get api and metadata
  constructor(meta) {
    runtime.meta = meta;
    runtime.api = new BdApi(runtime.meta.name);
  }

  // Initialize the plugin when it is enabled
  start = async () => {
    this.changelog();
    this.getComponents();

    this.experiments(true);
  };

  // Terminate the plugin when it is disabled
  stop = async () => {
    this.experiments(false);
  };

  // Shows the changelog, if necessary
  changelog = () => {
    const savedVersion = runtime.api.Data.load('version');
    if (savedVersion !== runtime.meta.version) {
      runtime.api.UI.showChangelogModal(
        {
          title: runtime.meta.name,
          subtitle: runtime.meta.version,
          blurb: runtime.meta.description,
          changes: config.changelog,
        },
      );
      runtime.api.Data.save('version', runtime.meta.version);
    }
  };

  // Gets the components necessary for the other functions
  getComponents = () => {
    // Get modules
    modules.userStore = runtime.api.Webpack.getByKeys('getUser');
    modules.dispatcher = runtime.api.Webpack.getByKeys('dispatch', 'isDispatching');
    modules.settings = runtime.api.Webpack.getByKeys('open', 'updateAccount');
    modules.layers = runtime.api.Webpack.getByKeys('layer', 'bg', 'baseLayer');

    // Get action stores
    actions.user = Object.values(modules.userStore._dispatcher._actionHandlers._dependencyGraph.nodes);
    actions.experiment = actions.user.find(store => store.name === 'ExperimentStore').actionHandler;
    actions.developer = actions.user.find(store => store.name === 'DeveloperExperimentStore').actionHandler;

    // Get current user
    runtime.user = modules.userStore.getCurrentUser();
  };

  // Turns experiments on or off
  // Basic approach borrowed from here: https://gist.github.com/MeguminSama/2cae24c9e4c335c661fa94e72235d4c4
  experiments = (on) => {
    // Bool to int
    let flag = on ? 1 : 0;

    // Set developer flag
    actions.experiment.CONNECTION_OPEN({
      type: 'CONNECTION_OPEN',
      user: { flags: runtime.user.flags |= flag },
      experiments: [],
    });

    // Reload experiments
    actions.developer.CONNECTION_OPEN();

    // Reset developer flag
    runtime.user.flags &= ~flag;

    // Rerender settings modal
    this.rerender();
  };

  // Force re-renders the settings pane if it is open
  rerender = () => {
    // Exit and re-enter settings
    if (document.querySelector('.' + modules.layers.baseLayer).getAttribute('aria-hidden') === 'true') {
      this.loading(true);
      modules.dispatcher.dispatch({ type: 'LAYER_POP' })
        .then(() => {
          setTimeout(() => {
            modules.settings.open();
            this.loading(false);
          }, 2000);
        });
    }
  };

  // Shows/hides the loading animation
  loading = (isLoading) => {
    if (isLoading) {
      runtime.api.DOM.addStyle(runtime.meta.name + '_loader', `
        .app__160d8:after {
          content: "${runtime.api.Plugins.isEnabled(runtime.meta.name) ? 'Enabling' : 'Disabling'} Experiments...";
          position: absolute;
          display: block;
          z-index: 9998;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          padding-top: 36px;
          color: var(--text-normal);
          background: var(--background-secondary);
          font-family: var(--font-primary);
          font-weight: var(--font-weight-normal);
          font-size: x-large;
          text-align: center;
          line-height: 100vh;
          transform: opacity 500ms;
          opacity: 0;
        }

        .app__160d8:before {
          content: "";
          background-image: url(//github.com/programmer2514/BetterDiscord-Experiments/raw/refs/heads/main/loading.gif);
          background-size: 128px auto;
          background-repeat: no-repeat;
          background-position: center;
          position: absolute;
          z-index: 9999;
          top: 50%;
          left: 50%;
          width: 128px;
          height: 128px;
          transform: translate(-50%, calc(-50% - 36px));
          transform: opacity 500ms;
          opacity: 0;
        }
      `);
      setTimeout(() => {
        runtime.api.DOM.addStyle(runtime.meta.name + '_loader_show', `
          .app__160d8:after,
          .app__160d8:before {
            opacity: 1;
          }
        `);
      }, 100);
    }
    else {
      setTimeout(() => runtime.api.DOM.removeStyle(runtime.meta.name + '_loader_show'), 100);
      setTimeout(() => runtime.api.DOM.removeStyle(runtime.meta.name + '_loader'), 500);
    }
  };
};
