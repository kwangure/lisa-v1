(function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function claim_element(nodes, name, attributes, svg) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeName === name) {
                for (let j = 0; j < node.attributes.length; j += 1) {
                    const attribute = node.attributes[j];
                    if (!attributes[attribute.name])
                        node.removeAttribute(attribute.name);
                }
                return nodes.splice(i, 1)[0]; // TODO strip unwanted attributes
            }
        }
        return svg ? svg_element(name) : element(name);
    }
    function claim_text(nodes, data) {
        for (let i = 0; i < nodes.length; i += 1) {
            const node = nodes[i];
            if (node.nodeType === 3) {
                node.data = data;
                return nodes.splice(i, 1)[0];
            }
        }
        return text(data);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    class ChromeError extends Error
    {
      constructor(...params) {
        super(...params);
      }
    }

    class Chrome
    {
      static get tabs() {
        return Tabs;
      }

      static get windows() {
        return Windows;
      }

      static get notifications() {
        return Notifications;
      }

      static get storage() {
        return Storage;
      }

      static get files() {
        return Files;
      }

      static get alarms() {
        return Alarms;
      }

      static get runtime() {
        return Runtime;
      }
    }

    function promise(fn) {
      return new Promise((resolve, reject) => {
        const callback = (...results) => {
          const err = chrome.runtime.lastError;
          if (err) {
            reject(new ChromeError(err.message));
          } else {
            resolve(...results);
          }
        };

        fn(callback);
      });
    }

    class Tabs
    {
      static async create(options) {
        // Create tab in specific window.
        const createInWindow = async windowId => {
          // Get the currently active tab in this window and make it the 'opener'
          // of the tab we're creating. When our tab is closed, the opener tab will
          // be reactivated.
          let tabs = await Chrome.tabs.query({ active: true, windowId });
          let openerTab = (tabs && tabs.length > 0) ? tabs[0] : {};
          let openerTabId = openerTab.id || null;
          let index = openerTab.index + 1 || 0;

          let tabOptions = { ...options, windowId, openerTabId, index };
          return promise(callback => {
            chrome.tabs.create(tabOptions, callback);
          });
        };

        try {
          let targetWindow = await Chrome.windows.getLastFocused({ windowTypes: ['normal'] });
          if (targetWindow) {
            return createInWindow(targetWindow.id);
          }
        } catch (e) {
          if (e instanceof ChromeError) {
            // We assume there was no last focused window, ignore.
            console.error(e);
          } else {
            throw e;
          }
        }

        // No active window for our tab, so we must create our own.
        let windowOptions = { focused: !!options.active };
        let newWindow = await Chrome.windows.create(windowOptions);
        return createInWindow(newWindow.id);
      }

      static async getCurrent() {
        return promise(callback => {
          chrome.tabs.getCurrent(callback);
        });
      }

      static async update(tabId, updateProperties) {
        return promise(callback => {
          chrome.tabs.update(tabId, updateProperties, callback);
        });
      }

      static async query(queryInfo) {
        return promise(callback => {
          chrome.tabs.query(queryInfo, callback);
        });
      }
    }

    class Windows
    {
      static async getAll(getInfo) {
        return promise(callback => {
          chrome.windows.getAll(getInfo, callback);
        });
      }

      static async getLastFocused(getInfo) {
        return promise(callback => {
          chrome.windows.getLastFocused(getInfo, callback);
        });
      }

      static async create(createData) {
        if (createData.state === 'maximized' && createData.type === 'popup') {
          let { os } = await Chrome.runtime.getPlatformInfo();
          if (os === chrome.runtime.PlatformOs.MAC) {
            // Bug workaround: On macOS, creating maximized popup windows is bugged
            // and creates really small windows instead. Here, we work around this
            // behavior by creating a window with its size equal to the screen size.
            createData = {
              ...createData,
              width: window.screen.width,
              height: window.screen.height,
              left: 0,
              top: 0
            };
            delete createData.state;
          }
        }

        return promise(callback => {
          chrome.windows.create(createData, callback);
        });
      }

      static async update(windowId, updateInfo) {
        return promise(callback => {
          chrome.windows.update(windowId, updateInfo, callback);
        });
      }
    }

    class Notifications
    {
      static async create(options) {
        return promise(callback => {
          try {
            chrome.notifications.create('', options, callback);
          } catch (e) {
            // This is failing on Firefox as it doesn't support the buttons option for the notification and raises an exception when this is called. (see http://bugzil.la/1190681)
            // Try again with a subset of options that are more broadly supported
            const compatibleOptions = {
              type: options.type,
              iconUrl: options.iconUrl,
              title: options.title,
              message: options.message
            };
            chrome.notifications.create('', compatibleOptions, callback);
          }
        });
      }
    }

    class Storage
    {
      constructor(store) {
        this.store = store;
      }

      get(keys = null) {
        return promise(callback => {
          this.store.get(keys, callback);
        });
      }

      set(obj) {
        return promise(callback => {
          this.store.set(obj, callback);
        });
      }

      clear() {
        return promise(callback => {
          this.store.clear(callback);
        });
      }

      static get sync() {
        if (!this._sync) {
          this._sync = new Storage(chrome.storage.sync);
        }
        return this._sync;
      }

      static get local() {
        if (!this._local) {
          this._local = new Storage(chrome.storage.local);
        }
        return this._local;
      }
    }

    class Files
    {
      static async readFile(file) {
        let url = chrome.runtime.getURL(file);
        let response = await fetch(url);
        return await response.text();
      }

      static async readBinary(file) {
        let url = chrome.runtime.getURL(file);
        let response = await fetch(url);
        return await response.arrayBuffer();
      }
    }

    class Alarms
    {
      static create(name, alarmInfo) {
        return chrome.alarms.create(name, alarmInfo);
      }

      static async clearAll() {
        return promise(callback => {
          chrome.alarms.clearAll(callback);
        });
      }
    }

    class Runtime
    {
      static getPlatformInfo() {
        return promise(callback => {
          chrome.runtime.getPlatformInfo(callback);
        });
      }
    }

    class Messages
    {
      get airplane() {
        return chrome.i18n.getMessage('airplane', []);
      }
      get analog_alarm_clock() {
        return chrome.i18n.getMessage('analog_alarm_clock', []);
      }
      get and() {
        return chrome.i18n.getMessage('and', []);
      }
      get antique_clock() {
        return chrome.i18n.getMessage('antique_clock', []);
      }
      get app_desc() {
        return chrome.i18n.getMessage('app_desc', []);
      }
      get app_name() {
        return chrome.i18n.getMessage('app_name', []);
      }
      get app_name_short() {
        return chrome.i18n.getMessage('app_name_short', []);
      }
      get april() {
        return chrome.i18n.getMessage('april', []);
      }
      get april_short() {
        return chrome.i18n.getMessage('april_short', []);
      }
      get attributions() {
        return chrome.i18n.getMessage('attributions', []);
      }
      get august() {
        return chrome.i18n.getMessage('august', []);
      }
      get august_short() {
        return chrome.i18n.getMessage('august_short', []);
      }
      get autostart_description() {
        return chrome.i18n.getMessage('autostart_description', []);
      }
      get autostart_notification_message() {
        return chrome.i18n.getMessage('autostart_notification_message', []);
      }
      get autostart_notification_title() {
        return chrome.i18n.getMessage('autostart_notification_title', []);
      }
      get autostart_title() {
        return chrome.i18n.getMessage('autostart_title', []);
      }
      average_stat(average) {
        return chrome.i18n.getMessage('average_stat', [average]);
      }
      get battle_horn() {
        return chrome.i18n.getMessage('battle_horn', []);
      }
      get bell_ring() {
        return chrome.i18n.getMessage('bell_ring', []);
      }
      get bike_horn() {
        return chrome.i18n.getMessage('bike_horn', []);
      }
      get bpm() {
        return chrome.i18n.getMessage('bpm', []);
      }
      get brown_noise() {
        return chrome.i18n.getMessage('brown_noise', []);
      }
      browser_action_tooltip(title, text) {
        return chrome.i18n.getMessage('browser_action_tooltip', [title, text]);
      }
      get chrome_web_store_description() {
        return chrome.i18n.getMessage('chrome_web_store_description', []);
      }
      get clear_history() {
        return chrome.i18n.getMessage('clear_history', []);
      }
      get clear_history_confirmation() {
        return chrome.i18n.getMessage('clear_history_confirmation', []);
      }
      get clear_history_description() {
        return chrome.i18n.getMessage('clear_history_description', []);
      }
      get clock() {
        return chrome.i18n.getMessage('clock', []);
      }
      get completed_today() {
        return chrome.i18n.getMessage('completed_today', []);
      }
      get computer_magic() {
        return chrome.i18n.getMessage('computer_magic', []);
      }
      get contributors() {
        return chrome.i18n.getMessage('contributors', []);
      }
      get countdown() {
        return chrome.i18n.getMessage('countdown', []);
      }
      get countdown_autoclose_tab() {
        return chrome.i18n.getMessage('countdown_autoclose_tab', []);
      }
      get countdown_autoclose_window() {
        return chrome.i18n.getMessage('countdown_autoclose_window', []);
      }
      get countdown_timer() {
        return chrome.i18n.getMessage('countdown_timer', []);
      }
      get custom() {
        return chrome.i18n.getMessage('custom', []);
      }
      get daily_distribution() {
        return chrome.i18n.getMessage('daily_distribution', []);
      }
      get daily_empty_placeholder() {
        return chrome.i18n.getMessage('daily_empty_placeholder', []);
      }
      daily_tooltip(pomodoros, start, end) {
        return chrome.i18n.getMessage('daily_tooltip', [pomodoros, start, end]);
      }
      get date_format() {
        return chrome.i18n.getMessage('date_format', []);
      }
      get date_time_format() {
        return chrome.i18n.getMessage('date_time_format', []);
      }
      get december() {
        return chrome.i18n.getMessage('december', []);
      }
      get december_short() {
        return chrome.i18n.getMessage('december_short', []);
      }
      get decimal_separator() {
        return chrome.i18n.getMessage('decimal_separator', []);
      }
      get desk_clock() {
        return chrome.i18n.getMessage('desk_clock', []);
      }
      get digital_alarm_clock() {
        return chrome.i18n.getMessage('digital_alarm_clock', []);
      }
      get digital_watch() {
        return chrome.i18n.getMessage('digital_watch', []);
      }
      get ding() {
        return chrome.i18n.getMessage('ding', []);
      }
      get ding_dong() {
        return chrome.i18n.getMessage('ding_dong', []);
      }
      get disclaimer() {
        return chrome.i18n.getMessage('disclaimer', []);
      }
      get do_not_show() {
        return chrome.i18n.getMessage('do_not_show', []);
      }
      get dong() {
        return chrome.i18n.getMessage('dong', []);
      }
      get duration() {
        return chrome.i18n.getMessage('duration', []);
      }
      get duration_seconds() {
        return chrome.i18n.getMessage('duration_seconds', []);
      }
      get electronic_chime() {
        return chrome.i18n.getMessage('electronic_chime', []);
      }
      get end_date() {
        return chrome.i18n.getMessage('end_date', []);
      }
      get end_iso_8601() {
        return chrome.i18n.getMessage('end_iso_8601', []);
      }
      get end_time() {
        return chrome.i18n.getMessage('end_time', []);
      }
      get end_timestamp() {
        return chrome.i18n.getMessage('end_timestamp', []);
      }
      get end_timezone() {
        return chrome.i18n.getMessage('end_timezone', []);
      }
      error_saving_settings(message) {
        return chrome.i18n.getMessage('error_saving_settings', [message]);
      }
      get every_10th_break() {
        return chrome.i18n.getMessage('every_10th_break', []);
      }
      get every_2nd_break() {
        return chrome.i18n.getMessage('every_2nd_break', []);
      }
      get every_3rd_break() {
        return chrome.i18n.getMessage('every_3rd_break', []);
      }
      get every_4th_break() {
        return chrome.i18n.getMessage('every_4th_break', []);
      }
      get every_5th_break() {
        return chrome.i18n.getMessage('every_5th_break', []);
      }
      get every_6th_break() {
        return chrome.i18n.getMessage('every_6th_break', []);
      }
      get every_7th_break() {
        return chrome.i18n.getMessage('every_7th_break', []);
      }
      get every_8th_break() {
        return chrome.i18n.getMessage('every_8th_break', []);
      }
      get every_9th_break() {
        return chrome.i18n.getMessage('every_9th_break', []);
      }
      get expire_title() {
        return chrome.i18n.getMessage('expire_title', []);
      }
      get export() {
        return chrome.i18n.getMessage('export', []);
      }
      get export_description() {
        return chrome.i18n.getMessage('export_description', []);
      }
      get february() {
        return chrome.i18n.getMessage('february', []);
      }
      get february_short() {
        return chrome.i18n.getMessage('february_short', []);
      }
      get feedback() {
        return chrome.i18n.getMessage('feedback', []);
      }
      get fire_pager() {
        return chrome.i18n.getMessage('fire_pager', []);
      }
      get focus() {
        return chrome.i18n.getMessage('focus', []);
      }
      get friday() {
        return chrome.i18n.getMessage('friday', []);
      }
      get friday_short() {
        return chrome.i18n.getMessage('friday_short', []);
      }
      get fullscreen() {
        return chrome.i18n.getMessage('fullscreen', []);
      }
      get glass_ping() {
        return chrome.i18n.getMessage('glass_ping', []);
      }
      get gong_1() {
        return chrome.i18n.getMessage('gong_1', []);
      }
      get gong_2() {
        return chrome.i18n.getMessage('gong_2', []);
      }
      group_pomodoros_hour_buckets(count) {
        return chrome.i18n.getMessage('group_pomodoros_hour_buckets', [count]);
      }
      group_pomodoros_minute_buckets(count) {
        return chrome.i18n.getMessage('group_pomodoros_minute_buckets', [count]);
      }
      get heatmap_date_format() {
        return chrome.i18n.getMessage('heatmap_date_format', []);
      }
      heatmap_tooltip(pomodoros, date) {
        return chrome.i18n.getMessage('heatmap_tooltip', [pomodoros, date]);
      }
      get height() {
        return chrome.i18n.getMessage('height', []);
      }
      get help_translate() {
        return chrome.i18n.getMessage('help_translate', []);
      }
      get history() {
        return chrome.i18n.getMessage('history', []);
      }
      get history_empty_placeholder() {
        return chrome.i18n.getMessage('history_empty_placeholder', []);
      }
      get hour_format() {
        return chrome.i18n.getMessage('hour_format', []);
      }
      get hour_minute_format() {
        return chrome.i18n.getMessage('hour_minute_format', []);
      }
      get hover_preview() {
        return chrome.i18n.getMessage('hover_preview', []);
      }
      hr_suffix(count) {
        return chrome.i18n.getMessage('hr_suffix', [count]);
      }
      get import() {
        return chrome.i18n.getMessage('import', []);
      }
      get import_confirmation() {
        return chrome.i18n.getMessage('import_confirmation', []);
      }
      get import_description() {
        return chrome.i18n.getMessage('import_description', []);
      }
      import_failed(error) {
        return chrome.i18n.getMessage('import_failed', [error]);
      }
      in_month(month) {
        return chrome.i18n.getMessage('in_month', [month]);
      }
      get invalid_duration_data() {
        return chrome.i18n.getMessage('invalid_duration_data', []);
      }
      get invalid_pomodoro_data() {
        return chrome.i18n.getMessage('invalid_pomodoro_data', []);
      }
      get invalid_timezone_data() {
        return chrome.i18n.getMessage('invalid_timezone_data', []);
      }
      get january() {
        return chrome.i18n.getMessage('january', []);
      }
      get january_short() {
        return chrome.i18n.getMessage('january_short', []);
      }
      get july() {
        return chrome.i18n.getMessage('july', []);
      }
      get july_short() {
        return chrome.i18n.getMessage('july_short', []);
      }
      get june() {
        return chrome.i18n.getMessage('june', []);
      }
      get june_short() {
        return chrome.i18n.getMessage('june_short', []);
      }
      get large_clock() {
        return chrome.i18n.getMessage('large_clock', []);
      }
      last_9_months(count) {
        return chrome.i18n.getMessage('last_9_months', [count]);
      }
      get less_than_minute() {
        return chrome.i18n.getMessage('less_than_minute', []);
      }
      get license() {
        return chrome.i18n.getMessage('license', []);
      }
      get long_break() {
        return chrome.i18n.getMessage('long_break', []);
      }
      get march() {
        return chrome.i18n.getMessage('march', []);
      }
      get march_short() {
        return chrome.i18n.getMessage('march_short', []);
      }
      get marinara_pomodoro_assistant() {
        return chrome.i18n.getMessage('marinara_pomodoro_assistant', []);
      }
      get may() {
        return chrome.i18n.getMessage('may', []);
      }
      get may_short() {
        return chrome.i18n.getMessage('may_short', []);
      }
      get metronome() {
        return chrome.i18n.getMessage('metronome', []);
      }
      min_suffix(count) {
        return chrome.i18n.getMessage('min_suffix', [count]);
      }
      get minute() {
        return chrome.i18n.getMessage('minute', []);
      }
      get minutes() {
        return chrome.i18n.getMessage('minutes', []);
      }
      get mismatched_pomodoro_duration_data() {
        return chrome.i18n.getMessage('mismatched_pomodoro_duration_data', []);
      }
      get mismatched_pomodoro_timezone_data() {
        return chrome.i18n.getMessage('mismatched_pomodoro_timezone_data', []);
      }
      get missing_duration_data() {
        return chrome.i18n.getMessage('missing_duration_data', []);
      }
      get missing_pomodoro_data() {
        return chrome.i18n.getMessage('missing_pomodoro_data', []);
      }
      get missing_timezone_data() {
        return chrome.i18n.getMessage('missing_timezone_data', []);
      }
      get monday() {
        return chrome.i18n.getMessage('monday', []);
      }
      get monday_short() {
        return chrome.i18n.getMessage('monday_short', []);
      }
      get music_box() {
        return chrome.i18n.getMessage('music_box', []);
      }
      n_minutes(count) {
        return chrome.i18n.getMessage('n_minutes', [count]);
      }
      get never() {
        return chrome.i18n.getMessage('never', []);
      }
      get noise() {
        return chrome.i18n.getMessage('noise', []);
      }
      get none() {
        return chrome.i18n.getMessage('none', []);
      }
      get november() {
        return chrome.i18n.getMessage('november', []);
      }
      get november_short() {
        return chrome.i18n.getMessage('november_short', []);
      }
      get october() {
        return chrome.i18n.getMessage('october', []);
      }
      get october_short() {
        return chrome.i18n.getMessage('october_short', []);
      }
      get pause_timer() {
        return chrome.i18n.getMessage('pause_timer', []);
      }
      get periodic_beat() {
        return chrome.i18n.getMessage('periodic_beat', []);
      }
      get pin_drop() {
        return chrome.i18n.getMessage('pin_drop', []);
      }
      get pink_noise() {
        return chrome.i18n.getMessage('pink_noise', []);
      }
      get play_audio_notification() {
        return chrome.i18n.getMessage('play_audio_notification', []);
      }
      get pomodoro_assistant() {
        return chrome.i18n.getMessage('pomodoro_assistant', []);
      }
      pomodoro_count_many(count) {
        return chrome.i18n.getMessage('pomodoro_count_many', [count]);
      }
      get pomodoro_count_one() {
        return chrome.i18n.getMessage('pomodoro_count_one', []);
      }
      get pomodoro_count_zero() {
        return chrome.i18n.getMessage('pomodoro_count_zero', []);
      }
      get pomodoro_history() {
        return chrome.i18n.getMessage('pomodoro_history', []);
      }
      pomodoros_completed_today(pomodoros) {
        return chrome.i18n.getMessage('pomodoros_completed_today', [pomodoros]);
      }
      pomodoros_imported(pomodoros) {
        return chrome.i18n.getMessage('pomodoros_imported', [pomodoros]);
      }
      pomodoros_until_long_break(pomodoros) {
        return chrome.i18n.getMessage('pomodoros_until_long_break', [pomodoros]);
      }
      get pulse() {
        return chrome.i18n.getMessage('pulse', []);
      }
      get reception_bell() {
        return chrome.i18n.getMessage('reception_bell', []);
      }
      get release_notes() {
        return chrome.i18n.getMessage('release_notes', []);
      }
      get report_an_issue() {
        return chrome.i18n.getMessage('report_an_issue', []);
      }
      get restart_pomodoro_cycle() {
        return chrome.i18n.getMessage('restart_pomodoro_cycle', []);
      }
      get restart_timer() {
        return chrome.i18n.getMessage('restart_timer', []);
      }
      get resume_timer() {
        return chrome.i18n.getMessage('resume_timer', []);
      }
      get robot_blip_1() {
        return chrome.i18n.getMessage('robot_blip_1', []);
      }
      get robot_blip_2() {
        return chrome.i18n.getMessage('robot_blip_2', []);
      }
      get saturday() {
        return chrome.i18n.getMessage('saturday', []);
      }
      get saturday_short() {
        return chrome.i18n.getMessage('saturday_short', []);
      }
      get save_as_csv() {
        return chrome.i18n.getMessage('save_as_csv', []);
      }
      get save_as_csv_description() {
        return chrome.i18n.getMessage('save_as_csv_description', []);
      }
      get september() {
        return chrome.i18n.getMessage('september', []);
      }
      get september_short() {
        return chrome.i18n.getMessage('september_short', []);
      }
      get settings() {
        return chrome.i18n.getMessage('settings', []);
      }
      get settings_saved() {
        return chrome.i18n.getMessage('settings_saved', []);
      }
      get ship_bell() {
        return chrome.i18n.getMessage('ship_bell', []);
      }
      get short_break() {
        return chrome.i18n.getMessage('short_break', []);
      }
      get show_desktop_notification() {
        return chrome.i18n.getMessage('show_desktop_notification', []);
      }
      get show_in_tab() {
        return chrome.i18n.getMessage('show_in_tab', []);
      }
      get show_in_window() {
        return chrome.i18n.getMessage('show_in_window', []);
      }
      get show_new_tab_notification() {
        return chrome.i18n.getMessage('show_new_tab_notification', []);
      }
      get small_clock() {
        return chrome.i18n.getMessage('small_clock', []);
      }
      get source_code() {
        return chrome.i18n.getMessage('source_code', []);
      }
      get speed_label() {
        return chrome.i18n.getMessage('speed_label', []);
      }
      get start_break() {
        return chrome.i18n.getMessage('start_break', []);
      }
      get start_break_now() {
        return chrome.i18n.getMessage('start_break_now', []);
      }
      get start_focusing() {
        return chrome.i18n.getMessage('start_focusing', []);
      }
      get start_focusing_now() {
        return chrome.i18n.getMessage('start_focusing_now', []);
      }
      get start_long_break() {
        return chrome.i18n.getMessage('start_long_break', []);
      }
      get start_long_break_now() {
        return chrome.i18n.getMessage('start_long_break_now', []);
      }
      get start_pomodoro_cycle() {
        return chrome.i18n.getMessage('start_pomodoro_cycle', []);
      }
      get start_short_break() {
        return chrome.i18n.getMessage('start_short_break', []);
      }
      get start_short_break_now() {
        return chrome.i18n.getMessage('start_short_break_now', []);
      }
      get stop_timer() {
        return chrome.i18n.getMessage('stop_timer', []);
      }
      get stopwatch() {
        return chrome.i18n.getMessage('stopwatch', []);
      }
      get sunday() {
        return chrome.i18n.getMessage('sunday', []);
      }
      get sunday_short() {
        return chrome.i18n.getMessage('sunday_short', []);
      }
      get take_a_break() {
        return chrome.i18n.getMessage('take_a_break', []);
      }
      get take_a_long_break() {
        return chrome.i18n.getMessage('take_a_long_break', []);
      }
      get take_a_long_break_setting() {
        return chrome.i18n.getMessage('take_a_long_break_setting', []);
      }
      get take_a_short_break() {
        return chrome.i18n.getMessage('take_a_short_break', []);
      }
      get this_month() {
        return chrome.i18n.getMessage('this_month', []);
      }
      get this_week() {
        return chrome.i18n.getMessage('this_week', []);
      }
      get thousands_separator() {
        return chrome.i18n.getMessage('thousands_separator', []);
      }
      get thursday() {
        return chrome.i18n.getMessage('thursday', []);
      }
      get thursday_short() {
        return chrome.i18n.getMessage('thursday_short', []);
      }
      get time() {
        return chrome.i18n.getMessage('time', []);
      }
      get time_format() {
        return chrome.i18n.getMessage('time_format', []);
      }
      get time_period_am() {
        return chrome.i18n.getMessage('time_period_am', []);
      }
      get time_period_pm() {
        return chrome.i18n.getMessage('time_period_pm', []);
      }
      time_remaining(time) {
        return chrome.i18n.getMessage('time_remaining', [time]);
      }
      get timer_paused() {
        return chrome.i18n.getMessage('timer_paused', []);
      }
      get timer_sound_label() {
        return chrome.i18n.getMessage('timer_sound_label', []);
      }
      get toaster_oven() {
        return chrome.i18n.getMessage('toaster_oven', []);
      }
      get today() {
        return chrome.i18n.getMessage('today', []);
      }
      get tone() {
        return chrome.i18n.getMessage('tone', []);
      }
      get total() {
        return chrome.i18n.getMessage('total', []);
      }
      get train_horn() {
        return chrome.i18n.getMessage('train_horn', []);
      }
      get tuesday() {
        return chrome.i18n.getMessage('tuesday', []);
      }
      get tuesday_short() {
        return chrome.i18n.getMessage('tuesday_short', []);
      }
      get version() {
        return chrome.i18n.getMessage('version', []);
      }
      get view() {
        return chrome.i18n.getMessage('view', []);
      }
      get view_history() {
        return chrome.i18n.getMessage('view_history', []);
      }
      get wall_clock() {
        return chrome.i18n.getMessage('wall_clock', []);
      }
      get wednesday() {
        return chrome.i18n.getMessage('wednesday', []);
      }
      get wednesday_short() {
        return chrome.i18n.getMessage('wednesday_short', []);
      }
      get weekly_distribution() {
        return chrome.i18n.getMessage('weekly_distribution', []);
      }
      get weekly_empty_placeholder() {
        return chrome.i18n.getMessage('weekly_empty_placeholder', []);
      }
      weekly_tooltip(pomodoros, day) {
        return chrome.i18n.getMessage('weekly_tooltip', [pomodoros, day]);
      }
      get when_complete() {
        return chrome.i18n.getMessage('when_complete', []);
      }
      get white_noise() {
        return chrome.i18n.getMessage('white_noise', []);
      }
      get width() {
        return chrome.i18n.getMessage('width', []);
      }
      get wind_up_clock() {
        return chrome.i18n.getMessage('wind_up_clock', []);
      }
      get wood_block() {
        return chrome.i18n.getMessage('wood_block', []);
      }
      get wristwatch() {
        return chrome.i18n.getMessage('wristwatch', []);
      }
      get write_a_review() {
        return chrome.i18n.getMessage('write_a_review', []);
      }
      get your_history() {
        return chrome.i18n.getMessage('your_history', []);
      }
    }

    var M = new Messages();

    function createNotificationSounds() {
      let sounds = [
        { name: M.tone, file: 'f62b45bc.mp3' },
        { name: M.digital_watch, file: 'be75f155.mp3' },
        { name: M.analog_alarm_clock, file: '0f034826.mp3' },
        { name: M.digital_alarm_clock, file: 'fee369b7.mp3' },
        { name: M.electronic_chime, file: '28d6b5be.mp3' },
        { name: M.gong_1, file: '8bce59b5.mp3' },
        { name: M.gong_2, file: '85cab25d.mp3' },
        { name: M.computer_magic, file: '5cf807ce.mp3' },
        { name: M.fire_pager, file: 'b38e515f.mp3' },
        { name: M.glass_ping, file: '2ed9509e.mp3' },
        { name: M.music_box, file: 'ebe7deb8.mp3' },
        { name: M.pin_drop, file: '2e13802a.mp3' },
        { name: M.robot_blip_1, file: 'bd50add0.mp3' },
        { name: M.robot_blip_2, file: '36e93c27.mp3' },
        { name: M.ship_bell, file: '9404f598.mp3' },
        { name: M.train_horn, file: '6a215611.mp3' },
        { name: M.bike_horn, file: '72312dd3.mp3' },
        { name: M.bell_ring, file: 'b10d75f2.mp3' },
        { name: M.reception_bell, file: '54b867f9.mp3' },
        { name: M.toaster_oven, file: 'a258e906.mp3' },
        { name: M.battle_horn, file: '88736c22.mp3' },
        { name: M.ding, file: '1a5066bd.mp3' },
        { name: M.dong, file: '5e122cee.mp3' },
        { name: M.ding_dong, file: '92ff2a8a.mp3' },
        { name: M.airplane, file: '72cb1b7f.mp3' }
      ];

      for (let sound of sounds) {
        sound.file = `/audio/${sound.file}`;
      }

      return sounds;
    }

    function createTimerSounds() {
      let sounds = [
        { name: M.stopwatch, files: ['4cf03078.mp3', 'edab7b0d.mp3'] },
        { name: M.wristwatch, files: ['8dc834f8.mp3', '831a5549.mp3'] },
        { name: M.clock, files: ['af607ff1.mp3', 'fd23aaf3.mp3'] },
        { name: M.wall_clock, files: ['6103cd58.mp3', 'cad167ea.mp3'] },
        { name: M.desk_clock, files: ['6a981bfc.mp3', 'fd64de98.mp3'] },
        { name: M.wind_up_clock, files: ['bc4e3db2.mp3', 'f9efd11b.mp3'] },
        { name: M.antique_clock, files: ['875326f9.mp3', 'cba5f173.mp3'] },
        { name: M.small_clock, files: ['89dafd3e.mp3', '0a0ec499.mp3'] },
        { name: M.large_clock, files: ['2122d2a4.mp3', 'a273ba0c.mp3'] },
        { name: M.wood_block, files: ['ad6eac9e.mp3'] },
        { name: M.metronome, files: ['bced7c21.mp3', '9bd67f7e.mp3'] },
        { name: M.pulse, files: ['fe5d2a62.mp3'] }
      ];

      for (let sound of sounds) {
        sound.files = sound.files.map(file => `/audio/${file}`);
      }

      return sounds;
    }

    async function play(filename) {
      if (!filename) {
        return;
      }

      // We use AudioContext instead of Audio since it works more
      // reliably in different browsers (Chrome, FF, Brave).
      let context = new AudioContext();

      let source = context.createBufferSource();
      source.connect(context.destination);
      source.buffer = await new Promise(async (resolve, reject) => {
        let content = await Chrome.files.readBinary(filename);
        context.decodeAudioData(content, buffer => resolve(buffer), error => reject(error));
      });

      await new Promise(resolve => {
        // Cleanup audio context after sound plays.
        source.onended = () => {
          context.close();
          resolve();
        };
        source.start();
      });
    }

    const notification = createNotificationSounds();
    const timer = createTimerSounds();

    var domain;

    // This constructor is used to store event handlers. Instantiating this is
    // faster than explicitly calling `Object.create(null)` to get a "clean" empty
    // object (tested with v8 v4.9).
    function EventHandlers() {}
    EventHandlers.prototype = Object.create(null);

    function EventEmitter() {
      EventEmitter.init.call(this);
    }

    // nodejs oddity
    // require('events') === require('events').EventEmitter
    EventEmitter.EventEmitter = EventEmitter;

    EventEmitter.usingDomains = false;

    EventEmitter.prototype.domain = undefined;
    EventEmitter.prototype._events = undefined;
    EventEmitter.prototype._maxListeners = undefined;

    // By default EventEmitters will print a warning if more than 10 listeners are
    // added to it. This is a useful default which helps finding memory leaks.
    EventEmitter.defaultMaxListeners = 10;

    EventEmitter.init = function() {
      this.domain = null;
      if (EventEmitter.usingDomains) {
        // if there is an active domain, then attach to it.
        if (domain.active && !(this instanceof domain.Domain)) ;
      }

      if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
        this._events = new EventHandlers();
        this._eventsCount = 0;
      }

      this._maxListeners = this._maxListeners || undefined;
    };

    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
    EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
      if (typeof n !== 'number' || n < 0 || isNaN(n))
        throw new TypeError('"n" argument must be a positive number');
      this._maxListeners = n;
      return this;
    };

    function $getMaxListeners(that) {
      if (that._maxListeners === undefined)
        return EventEmitter.defaultMaxListeners;
      return that._maxListeners;
    }

    EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
      return $getMaxListeners(this);
    };

    // These standalone emit* functions are used to optimize calling of event
    // handlers for fast cases because emit() itself often has a variable number of
    // arguments and can be deoptimized because of that. These functions always have
    // the same number of arguments and thus do not get deoptimized, so the code
    // inside them can execute faster.
    function emitNone(handler, isFn, self) {
      if (isFn)
        handler.call(self);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self);
      }
    }
    function emitOne(handler, isFn, self, arg1) {
      if (isFn)
        handler.call(self, arg1);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1);
      }
    }
    function emitTwo(handler, isFn, self, arg1, arg2) {
      if (isFn)
        handler.call(self, arg1, arg2);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2);
      }
    }
    function emitThree(handler, isFn, self, arg1, arg2, arg3) {
      if (isFn)
        handler.call(self, arg1, arg2, arg3);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2, arg3);
      }
    }

    function emitMany(handler, isFn, self, args) {
      if (isFn)
        handler.apply(self, args);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].apply(self, args);
      }
    }

    EventEmitter.prototype.emit = function emit(type) {
      var er, handler, len, args, i, events, domain;
      var doError = (type === 'error');

      events = this._events;
      if (events)
        doError = (doError && events.error == null);
      else if (!doError)
        return false;

      domain = this.domain;

      // If there is no 'error' event listener then throw.
      if (doError) {
        er = arguments[1];
        if (domain) {
          if (!er)
            er = new Error('Uncaught, unspecified "error" event');
          er.domainEmitter = this;
          er.domain = domain;
          er.domainThrown = false;
          domain.emit('error', er);
        } else if (er instanceof Error) {
          throw er; // Unhandled 'error' event
        } else {
          // At least give some kind of context to the user
          var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
          err.context = er;
          throw err;
        }
        return false;
      }

      handler = events[type];

      if (!handler)
        return false;

      var isFn = typeof handler === 'function';
      len = arguments.length;
      switch (len) {
        // fast cases
        case 1:
          emitNone(handler, isFn, this);
          break;
        case 2:
          emitOne(handler, isFn, this, arguments[1]);
          break;
        case 3:
          emitTwo(handler, isFn, this, arguments[1], arguments[2]);
          break;
        case 4:
          emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
          break;
        // slower
        default:
          args = new Array(len - 1);
          for (i = 1; i < len; i++)
            args[i - 1] = arguments[i];
          emitMany(handler, isFn, this, args);
      }

      return true;
    };

    function _addListener(target, type, listener, prepend) {
      var m;
      var events;
      var existing;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = target._events;
      if (!events) {
        events = target._events = new EventHandlers();
        target._eventsCount = 0;
      } else {
        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (events.newListener) {
          target.emit('newListener', type,
                      listener.listener ? listener.listener : listener);

          // Re-assign `events` because a newListener handler could have caused the
          // this._events to be assigned to a new object
          events = target._events;
        }
        existing = events[type];
      }

      if (!existing) {
        // Optimize the case of one listener. Don't need the extra array object.
        existing = events[type] = listener;
        ++target._eventsCount;
      } else {
        if (typeof existing === 'function') {
          // Adding the second element, need to change to array.
          existing = events[type] = prepend ? [listener, existing] :
                                              [existing, listener];
        } else {
          // If we've already got an array, just append.
          if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
        }

        // Check for listener leak
        if (!existing.warned) {
          m = $getMaxListeners(target);
          if (m && m > 0 && existing.length > m) {
            existing.warned = true;
            var w = new Error('Possible EventEmitter memory leak detected. ' +
                                existing.length + ' ' + type + ' listeners added. ' +
                                'Use emitter.setMaxListeners() to increase limit');
            w.name = 'MaxListenersExceededWarning';
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            emitWarning(w);
          }
        }
      }

      return target;
    }
    function emitWarning(e) {
      typeof console.warn === 'function' ? console.warn(e) : console.log(e);
    }
    EventEmitter.prototype.addListener = function addListener(type, listener) {
      return _addListener(this, type, listener, false);
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.prependListener =
        function prependListener(type, listener) {
          return _addListener(this, type, listener, true);
        };

    function _onceWrap(target, type, listener) {
      var fired = false;
      function g() {
        target.removeListener(type, g);
        if (!fired) {
          fired = true;
          listener.apply(target, arguments);
        }
      }
      g.listener = listener;
      return g;
    }

    EventEmitter.prototype.once = function once(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.on(type, _onceWrap(this, type, listener));
      return this;
    };

    EventEmitter.prototype.prependOnceListener =
        function prependOnceListener(type, listener) {
          if (typeof listener !== 'function')
            throw new TypeError('"listener" argument must be a function');
          this.prependListener(type, _onceWrap(this, type, listener));
          return this;
        };

    // emits a 'removeListener' event iff the listener was removed
    EventEmitter.prototype.removeListener =
        function removeListener(type, listener) {
          var list, events, position, i, originalListener;

          if (typeof listener !== 'function')
            throw new TypeError('"listener" argument must be a function');

          events = this._events;
          if (!events)
            return this;

          list = events[type];
          if (!list)
            return this;

          if (list === listener || (list.listener && list.listener === listener)) {
            if (--this._eventsCount === 0)
              this._events = new EventHandlers();
            else {
              delete events[type];
              if (events.removeListener)
                this.emit('removeListener', type, list.listener || listener);
            }
          } else if (typeof list !== 'function') {
            position = -1;

            for (i = list.length; i-- > 0;) {
              if (list[i] === listener ||
                  (list[i].listener && list[i].listener === listener)) {
                originalListener = list[i].listener;
                position = i;
                break;
              }
            }

            if (position < 0)
              return this;

            if (list.length === 1) {
              list[0] = undefined;
              if (--this._eventsCount === 0) {
                this._events = new EventHandlers();
                return this;
              } else {
                delete events[type];
              }
            } else {
              spliceOne(list, position);
            }

            if (events.removeListener)
              this.emit('removeListener', type, originalListener || listener);
          }

          return this;
        };

    EventEmitter.prototype.removeAllListeners =
        function removeAllListeners(type) {
          var listeners, events;

          events = this._events;
          if (!events)
            return this;

          // not listening for removeListener, no need to emit
          if (!events.removeListener) {
            if (arguments.length === 0) {
              this._events = new EventHandlers();
              this._eventsCount = 0;
            } else if (events[type]) {
              if (--this._eventsCount === 0)
                this._events = new EventHandlers();
              else
                delete events[type];
            }
            return this;
          }

          // emit removeListener for all listeners on all events
          if (arguments.length === 0) {
            var keys = Object.keys(events);
            for (var i = 0, key; i < keys.length; ++i) {
              key = keys[i];
              if (key === 'removeListener') continue;
              this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = new EventHandlers();
            this._eventsCount = 0;
            return this;
          }

          listeners = events[type];

          if (typeof listeners === 'function') {
            this.removeListener(type, listeners);
          } else if (listeners) {
            // LIFO order
            do {
              this.removeListener(type, listeners[listeners.length - 1]);
            } while (listeners[0]);
          }

          return this;
        };

    EventEmitter.prototype.listeners = function listeners(type) {
      var evlistener;
      var ret;
      var events = this._events;

      if (!events)
        ret = [];
      else {
        evlistener = events[type];
        if (!evlistener)
          ret = [];
        else if (typeof evlistener === 'function')
          ret = [evlistener.listener || evlistener];
        else
          ret = unwrapListeners(evlistener);
      }

      return ret;
    };

    EventEmitter.listenerCount = function(emitter, type) {
      if (typeof emitter.listenerCount === 'function') {
        return emitter.listenerCount(type);
      } else {
        return listenerCount.call(emitter, type);
      }
    };

    EventEmitter.prototype.listenerCount = listenerCount;
    function listenerCount(type) {
      var events = this._events;

      if (events) {
        var evlistener = events[type];

        if (typeof evlistener === 'function') {
          return 1;
        } else if (evlistener) {
          return evlistener.length;
        }
      }

      return 0;
    }

    EventEmitter.prototype.eventNames = function eventNames() {
      return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
    };

    // About 1.5x faster than the two-arg version of Array#splice().
    function spliceOne(list, index) {
      for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
        list[i] = list[k];
      list.pop();
    }

    function arrayClone(arr, i) {
      var copy = new Array(i);
      while (i--)
        copy[i] = arr[i];
      return copy;
    }

    function unwrapListeners(arr) {
      var ret = new Array(arr.length);
      for (var i = 0; i < ret.length; ++i) {
        ret[i] = arr[i].listener || arr[i];
      }
      return ret;
    }

    class ServiceBroker
    {
      constructor() {
        this.services = {};
        chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
      }

      static get instance() {
        if (!this._instance) {
          this._instance = new ServiceBroker();
        }
        return this._instance;
      }

      static register(service) {
        return this.instance.register(service);
      }

      static async invoke(call) {
        return await this.instance.invoke(call);
      }

      register(service) {
        this.services[service.constructor.name] = service;
        return service;
      }

      unregister(service) {
        delete this.services[service.constructor.name];
        return service;
      }

      async invoke({ serviceName, methodName, args }) {
        let service = this.services[serviceName];
        if (service) {
          if (service[methodName]) {
            // Service is defined in this context, call method directly.
            return await service[methodName](...args);
          } else {
            throw new Exception(`Invalid service request: ${serviceName}.${methodName}.`);
          }
        }

        // Service is defined in another context, use sendMessage to call it.
        return await new Promise((resolve, reject) => {
          let message = { serviceName, methodName, args };
          chrome.runtime.sendMessage(message, ({ result, error }) => {
            if (error !== undefined) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });
      }

      onMessage({ serviceName, methodName, args }, sender, respond) {
        let service = this.services[serviceName];
        if (!service || methodName === undefined) {
          // Service is not defined in this context, so we have nothing to do.
          return;
        }

        if (!service[methodName]) {
          respond({ error: `Invalid service request: ${serviceName}.${methodName}.` });
          return true;
        }

        (async () => {
          try {
            respond({ result: await service[methodName](...args) });
          } catch (e) {
            console.error(e);
            respond({ error: `${e}` });
          }
        })();

        return true;
      }
    }

    class ServiceProxy extends EventEmitter
    {
      constructor(serviceName) {
        super();
        this.serviceName = serviceName;
        this.listenerCount = 0;

        this.on('removeListener', () => {
          if (--this.listenerCount === 0) {
            chrome.runtime.onMessage.removeListener(this.onMessage);
          }
        });

        this.on('newListener', () => {
          if (++this.listenerCount === 1) {
            this.onMessage = this._onMessage.bind(this);
            chrome.runtime.onMessage.addListener(this.onMessage);
          }
        });
      }

      dispose() {
        this.removeAllListeners();
        chrome.runtime.onMessage.removeListener(this.onMessage);
      }

      get(target, prop, receiver) {
        if (this[prop]) {
          return this[prop];
        }

        const self = this;
        return async function() {
          const call = {
            serviceName: self.serviceName,
            methodName: prop,
            args: Array.from(arguments)
          };
          return await ServiceBroker.invoke(call);
        };
      }

      _onMessage({ serviceName, eventName, args }, sender, respond) {
        if (serviceName !== this.serviceName || eventName === undefined) {
          return;
        }

        this.emit(eventName, ...args);
      }
    }

    class Service
    {
      constructor() {
        this.clients = {};
        this.serviceName = this.constructor.name;
      }

      emit(eventName, ...args) {
        chrome.runtime.sendMessage({
          serviceName: this.serviceName,
          eventName,
          args
        });
      }

      static get proxy() {
        const serviceName = this.name;
        const create = () => new Proxy(function() {}, new ServiceProxy(serviceName));

        const handler = {
          construct(target, args) {
            return create();
          },
          get(target, prop, receiver) {
            // Support one-shot service invocations.
            // This creates a client, performs the RPC, then cleans up.
            // Example usage: let result = await SomeClient.once.doThing('abc', 123);

            if (prop !== 'once') {
              return undefined;
            }

            return new Proxy(function() {}, {
              get(target, prop, receiver) {
                return (...args) => {
                  let client = create();
                  try {
                    return client[prop](...args);
                  } finally {
                    client.dispose();
                  }
                };
              }
            });
          }
        };

        return new Proxy(function() {}, handler);
      }
    }

    class EnumOption
    {
      constructor(name, value) {
        if (!Object.is(value, undefined)) {
          this.value = value;
        }

        this.symbol = Symbol.for(name);

        Object.freeze(this);
      }

      [Symbol.toPrimitive](hint) {
        return this.value;
      }

      toString() {
        return this.symbol;
      }

      valueOf() {
        return this.value;
      }

      toJSON() {
        return this.value;
      }
    }

    class Enum
    {
      constructor(options) {
        for (let key in options) {
          this[key] = new EnumOption(key, options[key]);
        }

        Object.freeze(this);
      }

      keys() {
        return Object.keys(this);
      }

      contains(option) {
        if (!(option instanceof EnumOption)) {
          return false;
        }

        return this[Symbol.keyFor(option.symbol)] === symbol;
      }
    }

    const PageHost = new Enum({
      Tab: 0,
      Window: 1
    });

    class SettingsService extends Service
    {
      constructor(settingsManager) {
        super();
        this.settingsManager = settingsManager;
      }

      async getSettings() {
        return await this.settingsManager.get();
      }

      async setSettings(settings) {
        if (!this._isValid(settings)) {
          return;
        }

        await this.settingsManager.set(settings);
      }

      _isValid(settings) {
        let phasesValid = [settings.focus, settings.shortBreak, settings.longBreak].every(this._isPhaseValid);
        if (!phasesValid) {
          return false;
        }

        let autostart = settings.autostart && settings.autostart.time;
        if (autostart && !autostart.match(/^\d+:\d+$/)) {
          return false;
        }

        return true;
      }

      _isPhaseValid(phase) {
        let { duration, timerSound, countdown } = phase;
        if (isNaN(duration) || duration <= 0 || duration > 999) {
          return false;
        }

        if (timerSound && timerSound.metronome) {
          let { bpm } = timerSound.metronome;
          if (isNaN(bpm) || bpm <= 0 || bpm > 1000) {
            return false;
          }
        }

        if (countdown.host === 'window') {
          let { resolution } = countdown;

          // Resolution must either be 'fullscreen' or a [width, height] array.
          let isValid = (resolution === 'fullscreen') || (Array.isArray(resolution) && resolution.length === 2 && resolution.every(Number.isInteger));
          if (!isValid) {
            return false;
          }
        }

        return true;
      }
    }

    class SoundsService extends Service
    {
      async getNotificationSounds() {
        return notification;
      }

      async getTimerSounds() {
        return timer;
      }
    }

    const SettingsClient = SettingsService.proxy;
    const SoundsClient = SoundsService.proxy;

    /* src/main/components/Icon.svelte generated by Svelte v3.7.1 */

    const file = "src/main/components/Icon.svelte";

    function create_fragment(ctx) {
    	var i, i_class_value, i_style_value, dispose;

    	return {
    		c: function create() {
    			i = element("i");
    			this.h();
    		},

    		l: function claim(nodes) {
    			i = claim_element(nodes, "I", { class: true, style: true }, false);
    			var i_nodes = children(i);

    			i_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			attr(i, "class", i_class_value = "mdi mdi-" + ctx.icon + " " + (ctx.spin ? 'mdi-spin': '') + " svelte-6wy2hj");
    			attr(i, "style", i_style_value = ctx.fontSize? `font-size: ${ctx.fontSize} px`: '');
    			add_location(i, file, 6, 0, 100);

    			dispose = [
    				listen(i, "click", ctx.click_handler),
    				listen(i, "dblclick", ctx.dblclick_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, i, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.icon || changed.spin) && i_class_value !== (i_class_value = "mdi mdi-" + ctx.icon + " " + (ctx.spin ? 'mdi-spin': '') + " svelte-6wy2hj")) {
    				attr(i, "class", i_class_value);
    			}

    			if ((changed.fontSize) && i_style_value !== (i_style_value = ctx.fontSize? `font-size: ${ctx.fontSize} px`: '')) {
    				attr(i, "style", i_style_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(i);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { icon, fontSize = false, spin = false } = $$props;

    	const writable_props = ['icon', 'fontSize', 'spin'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function dblclick_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    		if ('fontSize' in $$props) $$invalidate('fontSize', fontSize = $$props.fontSize);
    		if ('spin' in $$props) $$invalidate('spin', spin = $$props.spin);
    	};

    	return {
    		icon,
    		fontSize,
    		spin,
    		click_handler,
    		dblclick_handler
    	};
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["icon", "fontSize", "spin"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.icon === undefined && !('icon' in props)) {
    			console.warn("<Icon> was created without expected prop 'icon'");
    		}
    	}

    	get icon() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fontSize() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fontSize(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get spin() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spin(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class Mutex
    {
      constructor() {
        this.queue = [];
        this.pending = false;
      }

      async exclusive(fn) {
        try {
          var release = await this.acquire();
          return await fn();
        } finally {
          release();
        }
      }

      async acquire() {
        const release = () => {
          this.pending = this.queue.length > 0;
          let next = this.queue.shift();
          next && next();
        };

        if (this.pending) {
          await new Promise(resolve => this.queue.push(resolve));
          return release;
        } else {
          this.pending = true;
          return release;
        }
      }
    }

    function loadAudio(context, file) {
      return new Promise(async (resolve, reject) => {
        let content = await Chrome.files.readBinary(file);
        context.decodeAudioData(content, buffer => resolve(buffer), error => reject(error));
      });
    }

    function roundUp(value, interval) {
      return interval * Math.ceil(value / interval);
    }

    class Metronome
    {
      constructor(context, buffers, period) {
        this.buffers = buffers;
        this.period = period;
        this.context = context;
        this.interval = null;

        this.scheduledTime = 0;
        this.soundIndex = 0;

        this.contextLock = new Mutex();
      }

      static async create(soundFiles, period) {
        let context = new AudioContext();
        await context.suspend();

        let buffers = [];
        for (let file of soundFiles) {
          let buffer = await loadAudio(context, file);
          buffers.push(buffer);
        }

        return new Metronome(context, buffers, period);
      }

      async start() {
        await this.contextLock.exclusive(async () => {
          if (!this.context || this.interval) {
            return;
          }

          const schedulePeriod = 15 * 1000;
          const scheduleSize = Math.max(2, 2 * (schedulePeriod / this.period));

          const schedule = () => {
            let frontierTime = roundUp(this.context.currentTime * 1000, this.period) + this.period * scheduleSize;
            while (this.scheduledTime < frontierTime) {
              this.scheduledTime += this.period;
              if (this.scheduledTime <= this.context.currentTime * 1000) {
                continue;
              }

              let source = this.context.createBufferSource();
              source.buffer = this.buffers[this.soundIndex];
              this.soundIndex = (this.soundIndex + 1) % this.buffers.length;

              source.connect(this.context.destination);
              source.start(this.scheduledTime / 1000);
            }
          };

          this.interval = setInterval(() => schedule(), schedulePeriod);
          schedule();

          await this.context.resume();
        });
      }

      async stop() {
        await this.contextLock.exclusive(async () => {
          await this._stop();
        });
      }

      async close() {
        await this.contextLock.exclusive(async () => {
          if (!this.context) {
            return;
          }

          await this._stop();
          await this.context.close();
          this.context = null;
        });
      }

      // Assumes contextLock is held.
      async _stop() {
        if (!this.context || !this.interval) {
          return;
        }

        clearInterval(this.interval);
        this.interval = null;
        await this.context.suspend();
      }
    }

    class Noise
    {
      static async create(createNode) {
        let context = new AudioContext();
        await context.suspend();

        let node = createNode(context);
        node.connect(context.destination);
        return new Noise(context);
      }

      constructor(context) {
        this.context = context;
      }

      async start() {
        await this.context.resume();
      }

      async stop() {
        await this.context.suspend();
      }

      async close() {
        if (!this.context) {
          return;
        }

        await this.stop();
        await this.context.close();
        this.context = null;
      }
    }

    // Noise generation adapted from Zach Denton's noise.js.
    // https://github.com/zacharydenton/noise.js
    // https://noisehack.com/generate-noise-web-audio-api/

    function whiteNoise(context) {
      const bufferSize = 4096;

      let node = context.createScriptProcessor(bufferSize, 1, 1);
      node.onaudioprocess = e => {
        let output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
          output[i] *= 0.01;
        }
      };

      return node;
    }

    function pinkNoise(context) {
      const bufferSize = 4096;
      let b0, b1, b2, b3, b4, b5, b6;
      b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;

      let node = context.createScriptProcessor(bufferSize, 1, 1);
      node.onaudioprocess = e => {
        let output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          let white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.005;
          b6 = white * 0.115926;
        }
      };

      return node;
    }

    function brownNoise(context) {
      const bufferSize = 4096;
      let lastOut = 0.0;

      let node = context.createScriptProcessor(bufferSize, 1, 1);
      node.onaudioprocess = e => {
        let output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          let white = Math.random() * 2 - 1;
          output[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = output[i];
          output[i] *= 0.2;
        }
      };

      return node;
    }

    async function createTimerSound(timerSound) {
      if (!timerSound) {
        return null;
      }

      if (timerSound.metronome) {
        let { files, bpm } = timerSound.metronome;
        let period = (60 / bpm) * 1000;
        return await Metronome.create(files, period);
      }

      let node = {
        'white-noise': whiteNoise,
        'pink-noise': pinkNoise,
        'brown-noise': brownNoise
      }[timerSound.procedural];

      if (!node) {
        throw new Error('Invalid procedural timer sound.');
      }

      return await Noise.create(node);
    }

    /* src/main/components/Input.svelte generated by Svelte v3.7.1 */

    const file$1 = "src/main/components/Input.svelte";

    // (24:4) {#if label && type !== 'checkbox' && type !== 'radio'}
    function create_if_block_2(ctx) {
    	var div, t_value = ctx.label.length? ctx.label : ctx.placeholder, t;

    	return {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			this.h();
    		},

    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true }, false);
    			var div_nodes = children(div);

    			t = claim_text(div_nodes, t_value);
    			div_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			attr(div, "class", "label svelte-1eayeua");
    			add_location(div, file$1, 24, 8, 725);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.label || changed.placeholder) && t_value !== (t_value = ctx.label.length? ctx.label : ctx.placeholder)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (27:4) {#if icon}
    function create_if_block_1(ctx) {
    	var span, current;

    	var icon_1 = new Icon({
    		props: { icon: ctx.icon },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			span = element("span");
    			icon_1.$$.fragment.c();
    			this.h();
    		},

    		l: function claim(nodes) {
    			span = claim_element(nodes, "SPAN", { class: true }, false);
    			var span_nodes = children(span);

    			icon_1.$$.fragment.l(span_nodes);
    			span_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			attr(span, "class", "input-prefix svelte-1eayeua");
    			add_location(span, file$1, 27, 8, 819);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    			mount_component(icon_1, span, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var icon_1_changes = {};
    			if (changed.icon) icon_1_changes.icon = ctx.icon;
    			icon_1.$set(icon_1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			destroy_component(icon_1);
    		}
    	};
    }

    // (37:4) {#if label && (type === 'checkbox' || type === 'radio')}
    function create_if_block(ctx) {
    	var span, t_value = ctx.label.length? ctx.label : ctx.placeholder, t;

    	return {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			this.h();
    		},

    		l: function claim(nodes) {
    			span = claim_element(nodes, "SPAN", { class: true }, false);
    			var span_nodes = children(span);

    			t = claim_text(span_nodes, t_value);
    			span_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			attr(span, "class", "label svelte-1eayeua");
    			add_location(span, file$1, 37, 8, 1270);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.label || changed.placeholder) && t_value !== (t_value = ctx.label.length? ctx.label : ctx.placeholder)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var label_1, t0, t1, input, input_class_value, t2, label_1_class_value, current, dispose;

    	var if_block0 = (ctx.label && ctx.type !== 'checkbox' && ctx.type !== 'radio') && create_if_block_2(ctx);

    	var if_block1 = (ctx.icon) && create_if_block_1(ctx);

    	var if_block2 = (ctx.label && (ctx.type === 'checkbox' || ctx.type === 'radio')) && create_if_block(ctx);

    	return {
    		c: function create() {
    			label_1 = element("label");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			if (if_block2) if_block2.c();
    			this.h();
    		},

    		l: function claim(nodes) {
    			label_1 = claim_element(nodes, "LABEL", { class: true }, false);
    			var label_1_nodes = children(label_1);

    			if (if_block0) if_block0.l(label_1_nodes);
    			t0 = claim_text(label_1_nodes, "\n    ");
    			if (if_block1) if_block1.l(label_1_nodes);
    			t1 = claim_text(label_1_nodes, "\n    ");

    			input = claim_element(label_1_nodes, "INPUT", { min: true, max: true, type: true, name: true, placeholder: true, value: true, disabled: true, checked: true, autofocus: true, class: true }, false);
    			var input_nodes = children(input);

    			input_nodes.forEach(detach);
    			t2 = claim_text(label_1_nodes, "\n    ");
    			if (if_block2) if_block2.l(label_1_nodes);
    			label_1_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			attr(input, "min", ctx.min);
    			attr(input, "max", ctx.max);
    			attr(input, "type", ctx.type);
    			attr(input, "name", ctx.name);
    			attr(input, "placeholder", ctx.placeholder);
    			input.value = ctx.value;
    			input.disabled = ctx.disabled;
    			input.checked = ctx.checked;
    			input.autofocus = true;
    			attr(input, "class", input_class_value = "" + (ctx.type === 'checkbox'? 'checkbox':'') + " " + (ctx.type === 'radio'? 'radio':'') + " svelte-1eayeua");
    			toggle_class(input, "icon", ctx.icon);
    			add_location(input, file$1, 31, 4, 910);
    			attr(label_1, "class", label_1_class_value = "input-wrapper " + (ctx.type === 'checkbox'? 'checkbox':'') + " " + (ctx.type === 'radio'? 'radio':'') + " svelte-1eayeua");
    			add_location(label_1, file$1, 22, 0, 560);

    			dispose = [
    				listen(input, "blur", ctx.blur_handler),
    				listen(input, "change", ctx.change_handler),
    				listen(input, "input", ctx.updateValue),
    				listen(input, "input", ctx.input_handler),
    				listen(input, "keypress", ctx.keypress_handler),
    				listen(input, "focus", ctx.focus_handler),
    				listen(input, "keydown", ctx.keydown_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, label_1, anchor);
    			if (if_block0) if_block0.m(label_1, null);
    			append(label_1, t0);
    			if (if_block1) if_block1.m(label_1, null);
    			append(label_1, t1);
    			append(label_1, input);
    			append(label_1, t2);
    			if (if_block2) if_block2.m(label_1, null);
    			current = true;
    			input.focus();
    		},

    		p: function update(changed, ctx) {
    			if (ctx.label && ctx.type !== 'checkbox' && ctx.type !== 'radio') {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(label_1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.icon) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(label_1, t1);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}

    			if (!current || changed.min) {
    				attr(input, "min", ctx.min);
    			}

    			if (!current || changed.max) {
    				attr(input, "max", ctx.max);
    			}

    			if (!current || changed.type) {
    				attr(input, "type", ctx.type);
    			}

    			if (!current || changed.name) {
    				attr(input, "name", ctx.name);
    			}

    			if (!current || changed.placeholder) {
    				attr(input, "placeholder", ctx.placeholder);
    			}

    			if (!current || changed.value) {
    				input.value = ctx.value;
    			}

    			if (!current || changed.disabled) {
    				input.disabled = ctx.disabled;
    			}

    			if (!current || changed.checked) {
    				input.checked = ctx.checked;
    			}

    			if ((!current || changed.type) && input_class_value !== (input_class_value = "" + (ctx.type === 'checkbox'? 'checkbox':'') + " " + (ctx.type === 'radio'? 'radio':'') + " svelte-1eayeua")) {
    				attr(input, "class", input_class_value);
    			}

    			if ((changed.type || changed.icon)) {
    				toggle_class(input, "icon", ctx.icon);
    			}

    			if (ctx.label && (ctx.type === 'checkbox' || ctx.type === 'radio')) {
    				if (if_block2) {
    					if_block2.p(changed, ctx);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(label_1, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if ((!current || changed.type) && label_1_class_value !== (label_1_class_value = "input-wrapper " + (ctx.type === 'checkbox'? 'checkbox':'') + " " + (ctx.type === 'radio'? 'radio':'') + " svelte-1eayeua")) {
    				attr(label_1, "class", label_1_class_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(label_1);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { type = 'text', name = '', label = '', placeholder = '', icon = '', checked = false, min = null, max = null, value = '', disabled = false, autofocus = false } = $$props;

        // Update value manually since Svelte does not allow data  
        // binding if input type is dynamic (and for good reason)
        function updateValue(e){
            $$invalidate('value', value=e.target.value);
        }

    	const writable_props = ['type', 'name', 'label', 'placeholder', 'icon', 'checked', 'min', 'max', 'value', 'disabled', 'autofocus'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	function blur_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function keypress_handler(event) {
    		bubble($$self, event);
    	}

    	function focus_handler(event) {
    		bubble($$self, event);
    	}

    	function keydown_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    		if ('checked' in $$props) $$invalidate('checked', checked = $$props.checked);
    		if ('min' in $$props) $$invalidate('min', min = $$props.min);
    		if ('max' in $$props) $$invalidate('max', max = $$props.max);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('autofocus' in $$props) $$invalidate('autofocus', autofocus = $$props.autofocus);
    	};

    	return {
    		type,
    		name,
    		label,
    		placeholder,
    		icon,
    		checked,
    		min,
    		max,
    		value,
    		disabled,
    		autofocus,
    		updateValue,
    		blur_handler,
    		change_handler,
    		input_handler,
    		keypress_handler,
    		focus_handler,
    		keydown_handler
    	};
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["type", "name", "label", "placeholder", "icon", "checked", "min", "max", "value", "disabled", "autofocus"]);
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autofocus() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autofocus(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/main/components/Page.svelte generated by Svelte v3.7.1 */

    const file$2 = "src/main/components/Page.svelte";

    function create_fragment$2(ctx) {
    	var div, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();
    			this.h();
    		},

    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true }, false);
    			var div_nodes = children(div);

    			if (default_slot) default_slot.l(div_nodes);
    			div_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			attr(div, "class", "page svelte-e5nqic");
    			add_location(div, file$2, 3, 0, 70);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { $$slots, $$scope };
    }

    class Page extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    	}
    }

    /* src/options/routes/Settings.svelte generated by Svelte v3.7.1 */

    const file$3 = "src/options/routes/Settings.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.sound = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.sound = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.sound = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.sound = list[i];
    	return child_ctx;
    }

    // (127:4) {#if settings}
    function create_if_block$1(ctx) {
    	var div28, div27, div12, div0, t0_value = M.focus, t0, t1, div2, span0, t2_value = M.duration, t2, t3, div1, updating_value, t4, span1, t5_value = ctx.settings.focus.duration == 1 ? M.minute: M.minutes, t5, t6, div4, span2, t7_value = M.timer_sound_label, t7, t8, div3, select0, option0, t9_value = M.none, t9, optgroup0, optgroup0_label_value, optgroup1, option1, t10_value = M.brown_noise, t10, option2, t11_value = M.pink_noise, t11, option3, t12_value = M.white_noise, t12, optgroup1_label_value, t13, span3, t14_value = M.during_focus_label, t14, t15, t16, t17, div5, t18, div6, t19_value = M.when_complete, t19, t20, div11, div7, updating_checked, t21, div8, updating_checked_1, t22, div10, span4, t23_value = M.play_audio_notification, t23, t24, div9, select1, option4, t25_value = M.none, t25, t26, div22, div13, t27_value = M.short_break, t27, t28, div15, span5, t29_value = M.duration, t29, t30, div14, updating_value_1, t31, span6, t32_value = ctx.settings.shortBreak.duration == 1 ? M.minute: M.minutes, t32, t33, div16, t34_value = M.when_complete, t34, t35, div21, div17, updating_checked_2, t36, div18, updating_checked_3, t37, div20, span7, t38_value = M.play_audio_notification, t38, t39, div19, select2, option5, t40_value = M.none, t40, t41, div26, div23, t42_value = M.long_break, t42, t43, div25, span8, t44_value = M.take_a_long_break_setting, t44, t45, div24, select3, option6, t46_value = M.never, t46, option7, t47_value = M.every_2nd_break, t47, option8, t48_value = M.every_3rd_break, t48, option9, t49_value = M.every_4th_break, t49, option10, t50_value = M.every_5th_break, t50, option11, t51_value = M.every_6th_break, t51, option12, t52_value = M.every_7th_break, t52, option13, t53_value = M.every_8th_break, t53, option14, t54_value = M.every_9th_break, t54, option15, t55_value = M.every_10th_break, t55, t56, t57, current, dispose;

    	function input0_value_binding(value) {
    		ctx.input0_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let input0_props = { type: "number", min: "1", max: "999" };
    	if (ctx.settings.focus.duration !== void 0) {
    		input0_props.value = ctx.settings.focus.duration;
    	}
    	var input0 = new Input({ props: input0_props, $$inline: true });

    	binding_callbacks.push(() => bind(input0, 'value', input0_value_binding));

    	var each_value_3 = ctx.timerSounds;

    	var each_blocks_2 = [];

    	for (var i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	var if_block0 = (ctx.canPlayTimerSound) && create_if_block_4(ctx);

    	var if_block1 = (ctx.focusTimerBPM != null) && create_if_block_3(ctx);

    	function input1_checked_binding(value_1) {
    		ctx.input1_checked_binding.call(null, value_1);
    		updating_checked = true;
    		add_flush_callback(() => updating_checked = false);
    	}

    	let input1_props = { type: "checkbox", label: M.show_desktop_notification };
    	if (ctx.settings.focus.notifications.desktop !== void 0) {
    		input1_props.checked = ctx.settings.focus.notifications.desktop;
    	}
    	var input1 = new Input({ props: input1_props, $$inline: true });

    	binding_callbacks.push(() => bind(input1, 'checked', input1_checked_binding));

    	function input2_checked_binding(value_2) {
    		ctx.input2_checked_binding.call(null, value_2);
    		updating_checked_1 = true;
    		add_flush_callback(() => updating_checked_1 = false);
    	}

    	let input2_props = { type: "checkbox", label: M.show_new_tab_notification };
    	if (ctx.settings.focus.notifications.tab !== void 0) {
    		input2_props.checked = ctx.settings.focus.notifications.tab;
    	}
    	var input2 = new Input({ props: input2_props, $$inline: true });

    	binding_callbacks.push(() => bind(input2, 'checked', input2_checked_binding));

    	var each_value_2 = ctx.notificationSounds;

    	var each_blocks_1 = [];

    	for (var i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	function input3_value_binding(value_3) {
    		ctx.input3_value_binding.call(null, value_3);
    		updating_value_1 = true;
    		add_flush_callback(() => updating_value_1 = false);
    	}

    	let input3_props = { type: "number", min: "1", max: "999" };
    	if (ctx.settings.shortBreak.duration !== void 0) {
    		input3_props.value = ctx.settings.shortBreak.duration;
    	}
    	var input3 = new Input({ props: input3_props, $$inline: true });

    	binding_callbacks.push(() => bind(input3, 'value', input3_value_binding));

    	function input4_checked_binding(value_4) {
    		ctx.input4_checked_binding.call(null, value_4);
    		updating_checked_2 = true;
    		add_flush_callback(() => updating_checked_2 = false);
    	}

    	let input4_props = { type: "checkbox", label: M.show_desktop_notification };
    	if (ctx.settings.shortBreak.notifications.desktop !== void 0) {
    		input4_props.checked = ctx.settings.shortBreak.notifications.desktop;
    	}
    	var input4 = new Input({ props: input4_props, $$inline: true });

    	binding_callbacks.push(() => bind(input4, 'checked', input4_checked_binding));

    	function input5_checked_binding(value_5) {
    		ctx.input5_checked_binding.call(null, value_5);
    		updating_checked_3 = true;
    		add_flush_callback(() => updating_checked_3 = false);
    	}

    	let input5_props = { type: "checkbox", label: M.show_new_tab_notification };
    	if (ctx.settings.shortBreak.notifications.tab !== void 0) {
    		input5_props.checked = ctx.settings.shortBreak.notifications.tab;
    	}
    	var input5 = new Input({ props: input5_props, $$inline: true });

    	binding_callbacks.push(() => bind(input5, 'checked', input5_checked_binding));

    	var each_value_1 = ctx.notificationSounds;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	var if_block2 = (ctx.settings.longBreak.interval != 0) && create_if_block_2$1(ctx);

    	var if_block3 = (ctx.showSettingsSaved) && create_if_block_1$1(ctx);

    	return {
    		c: function create() {
    			div28 = element("div");
    			div27 = element("div");
    			div12 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div2 = element("div");
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			div1 = element("div");
    			input0.$$.fragment.c();
    			t4 = space();
    			span1 = element("span");
    			t5 = text(t5_value);
    			t6 = space();
    			div4 = element("div");
    			span2 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			div3 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			t9 = text(t9_value);
    			optgroup0 = element("optgroup");

    			for (var i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			optgroup1 = element("optgroup");
    			option1 = element("option");
    			t10 = text(t10_value);
    			option2 = element("option");
    			t11 = text(t11_value);
    			option3 = element("option");
    			t12 = text(t12_value);
    			t13 = space();
    			span3 = element("span");
    			t14 = text(t14_value);
    			t15 = text(" ");
    			t16 = space();
    			if (if_block0) if_block0.c();
    			t17 = space();
    			div5 = element("div");
    			if (if_block1) if_block1.c();
    			t18 = space();
    			div6 = element("div");
    			t19 = text(t19_value);
    			t20 = space();
    			div11 = element("div");
    			div7 = element("div");
    			input1.$$.fragment.c();
    			t21 = space();
    			div8 = element("div");
    			input2.$$.fragment.c();
    			t22 = space();
    			div10 = element("div");
    			span4 = element("span");
    			t23 = text(t23_value);
    			t24 = space();
    			div9 = element("div");
    			select1 = element("select");
    			option4 = element("option");
    			t25 = text(t25_value);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t26 = space();
    			div22 = element("div");
    			div13 = element("div");
    			t27 = text(t27_value);
    			t28 = space();
    			div15 = element("div");
    			span5 = element("span");
    			t29 = text(t29_value);
    			t30 = space();
    			div14 = element("div");
    			input3.$$.fragment.c();
    			t31 = space();
    			span6 = element("span");
    			t32 = text(t32_value);
    			t33 = space();
    			div16 = element("div");
    			t34 = text(t34_value);
    			t35 = space();
    			div21 = element("div");
    			div17 = element("div");
    			input4.$$.fragment.c();
    			t36 = space();
    			div18 = element("div");
    			input5.$$.fragment.c();
    			t37 = space();
    			div20 = element("div");
    			span7 = element("span");
    			t38 = text(t38_value);
    			t39 = space();
    			div19 = element("div");
    			select2 = element("select");
    			option5 = element("option");
    			t40 = text(t40_value);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t41 = space();
    			div26 = element("div");
    			div23 = element("div");
    			t42 = text(t42_value);
    			t43 = space();
    			div25 = element("div");
    			span8 = element("span");
    			t44 = text(t44_value);
    			t45 = space();
    			div24 = element("div");
    			select3 = element("select");
    			option6 = element("option");
    			t46 = text(t46_value);
    			option7 = element("option");
    			t47 = text(t47_value);
    			option8 = element("option");
    			t48 = text(t48_value);
    			option9 = element("option");
    			t49 = text(t49_value);
    			option10 = element("option");
    			t50 = text(t50_value);
    			option11 = element("option");
    			t51 = text(t51_value);
    			option12 = element("option");
    			t52 = text(t52_value);
    			option13 = element("option");
    			t53 = text(t53_value);
    			option14 = element("option");
    			t54 = text(t54_value);
    			option15 = element("option");
    			t55 = text(t55_value);
    			t56 = space();
    			if (if_block2) if_block2.c();
    			t57 = space();
    			if (if_block3) if_block3.c();
    			this.h();
    		},

    		l: function claim(nodes) {
    			div28 = claim_element(nodes, "DIV", { class: true }, false);
    			var div28_nodes = children(div28);

    			div27 = claim_element(div28_nodes, "DIV", { class: true }, false);
    			var div27_nodes = children(div27);

    			div12 = claim_element(div27_nodes, "DIV", { class: true }, false);
    			var div12_nodes = children(div12);

    			div0 = claim_element(div12_nodes, "DIV", { class: true }, false);
    			var div0_nodes = children(div0);

    			t0 = claim_text(div0_nodes, t0_value);
    			div0_nodes.forEach(detach);
    			t1 = claim_text(div12_nodes, "\n                    ");

    			div2 = claim_element(div12_nodes, "DIV", { class: true }, false);
    			var div2_nodes = children(div2);

    			span0 = claim_element(div2_nodes, "SPAN", {}, false);
    			var span0_nodes = children(span0);

    			t2 = claim_text(span0_nodes, t2_value);
    			span0_nodes.forEach(detach);
    			t3 = claim_text(div2_nodes, "\n                        ");

    			div1 = claim_element(div2_nodes, "DIV", { class: true }, false);
    			var div1_nodes = children(div1);

    			input0.$$.fragment.l(div1_nodes);
    			div1_nodes.forEach(detach);
    			t4 = claim_text(div2_nodes, "\n                        ");

    			span1 = claim_element(div2_nodes, "SPAN", {}, false);
    			var span1_nodes = children(span1);

    			t5 = claim_text(span1_nodes, t5_value);
    			span1_nodes.forEach(detach);
    			div2_nodes.forEach(detach);
    			t6 = claim_text(div12_nodes, "\n                    ");

    			div4 = claim_element(div12_nodes, "DIV", { class: true }, false);
    			var div4_nodes = children(div4);

    			span2 = claim_element(div4_nodes, "SPAN", {}, false);
    			var span2_nodes = children(span2);

    			t7 = claim_text(span2_nodes, t7_value);
    			span2_nodes.forEach(detach);
    			t8 = claim_text(div4_nodes, "\n                        ");

    			div3 = claim_element(div4_nodes, "DIV", { class: true }, false);
    			var div3_nodes = children(div3);

    			select0 = claim_element(div3_nodes, "SELECT", { class: true }, false);
    			var select0_nodes = children(select0);

    			option0 = claim_element(select0_nodes, "OPTION", { value: true, class: true }, false);
    			var option0_nodes = children(option0);

    			t9 = claim_text(option0_nodes, t9_value);
    			option0_nodes.forEach(detach);

    			optgroup0 = claim_element(select0_nodes, "OPTGROUP", { label: true }, false);
    			var optgroup0_nodes = children(optgroup0);

    			for (var i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].l(optgroup0_nodes);
    			}

    			optgroup0_nodes.forEach(detach);

    			optgroup1 = claim_element(select0_nodes, "OPTGROUP", { label: true }, false);
    			var optgroup1_nodes = children(optgroup1);

    			option1 = claim_element(optgroup1_nodes, "OPTION", { value: true, class: true }, false);
    			var option1_nodes = children(option1);

    			t10 = claim_text(option1_nodes, t10_value);
    			option1_nodes.forEach(detach);

    			option2 = claim_element(optgroup1_nodes, "OPTION", { value: true, class: true }, false);
    			var option2_nodes = children(option2);

    			t11 = claim_text(option2_nodes, t11_value);
    			option2_nodes.forEach(detach);

    			option3 = claim_element(optgroup1_nodes, "OPTION", { value: true, class: true }, false);
    			var option3_nodes = children(option3);

    			t12 = claim_text(option3_nodes, t12_value);
    			option3_nodes.forEach(detach);
    			optgroup1_nodes.forEach(detach);
    			select0_nodes.forEach(detach);
    			div3_nodes.forEach(detach);
    			t13 = claim_text(div4_nodes, "\n                        ");

    			span3 = claim_element(div4_nodes, "SPAN", {}, false);
    			var span3_nodes = children(span3);

    			t14 = claim_text(span3_nodes, t14_value);
    			t15 = claim_text(span3_nodes, " ");
    			span3_nodes.forEach(detach);
    			t16 = claim_text(div4_nodes, "\n                        ");
    			if (if_block0) if_block0.l(div4_nodes);
    			div4_nodes.forEach(detach);
    			t17 = claim_text(div12_nodes, "\n                    ");

    			div5 = claim_element(div12_nodes, "DIV", { class: true }, false);
    			var div5_nodes = children(div5);

    			if (if_block1) if_block1.l(div5_nodes);
    			div5_nodes.forEach(detach);
    			t18 = claim_text(div12_nodes, "\n                    ");

    			div6 = claim_element(div12_nodes, "DIV", { class: true }, false);
    			var div6_nodes = children(div6);

    			t19 = claim_text(div6_nodes, t19_value);
    			div6_nodes.forEach(detach);
    			t20 = claim_text(div12_nodes, "\n                    ");

    			div11 = claim_element(div12_nodes, "DIV", { class: true }, false);
    			var div11_nodes = children(div11);

    			div7 = claim_element(div11_nodes, "DIV", { class: true }, false);
    			var div7_nodes = children(div7);

    			input1.$$.fragment.l(div7_nodes);
    			div7_nodes.forEach(detach);
    			t21 = claim_text(div11_nodes, "\n                        ");

    			div8 = claim_element(div11_nodes, "DIV", { class: true }, false);
    			var div8_nodes = children(div8);

    			input2.$$.fragment.l(div8_nodes);
    			div8_nodes.forEach(detach);
    			t22 = claim_text(div11_nodes, "\n                        ");

    			div10 = claim_element(div11_nodes, "DIV", { class: true }, false);
    			var div10_nodes = children(div10);

    			span4 = claim_element(div10_nodes, "SPAN", {}, false);
    			var span4_nodes = children(span4);

    			t23 = claim_text(span4_nodes, t23_value);
    			span4_nodes.forEach(detach);
    			t24 = claim_text(div10_nodes, "\n                            ");

    			div9 = claim_element(div10_nodes, "DIV", { class: true }, false);
    			var div9_nodes = children(div9);

    			select1 = claim_element(div9_nodes, "SELECT", { class: true }, false);
    			var select1_nodes = children(select1);

    			option4 = claim_element(select1_nodes, "OPTION", { value: true, class: true }, false);
    			var option4_nodes = children(option4);

    			t25 = claim_text(option4_nodes, t25_value);
    			option4_nodes.forEach(detach);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].l(select1_nodes);
    			}

    			select1_nodes.forEach(detach);
    			div9_nodes.forEach(detach);
    			div10_nodes.forEach(detach);
    			div11_nodes.forEach(detach);
    			div12_nodes.forEach(detach);
    			t26 = claim_text(div27_nodes, "\n                ");

    			div22 = claim_element(div27_nodes, "DIV", { class: true }, false);
    			var div22_nodes = children(div22);

    			div13 = claim_element(div22_nodes, "DIV", { class: true }, false);
    			var div13_nodes = children(div13);

    			t27 = claim_text(div13_nodes, t27_value);
    			div13_nodes.forEach(detach);
    			t28 = claim_text(div22_nodes, "\n                    ");

    			div15 = claim_element(div22_nodes, "DIV", { class: true }, false);
    			var div15_nodes = children(div15);

    			span5 = claim_element(div15_nodes, "SPAN", {}, false);
    			var span5_nodes = children(span5);

    			t29 = claim_text(span5_nodes, t29_value);
    			span5_nodes.forEach(detach);
    			t30 = claim_text(div15_nodes, "\n                        ");

    			div14 = claim_element(div15_nodes, "DIV", { class: true }, false);
    			var div14_nodes = children(div14);

    			input3.$$.fragment.l(div14_nodes);
    			div14_nodes.forEach(detach);
    			t31 = claim_text(div15_nodes, "\n                        ");

    			span6 = claim_element(div15_nodes, "SPAN", {}, false);
    			var span6_nodes = children(span6);

    			t32 = claim_text(span6_nodes, t32_value);
    			span6_nodes.forEach(detach);
    			div15_nodes.forEach(detach);
    			t33 = claim_text(div22_nodes, "\n                    ");

    			div16 = claim_element(div22_nodes, "DIV", { class: true }, false);
    			var div16_nodes = children(div16);

    			t34 = claim_text(div16_nodes, t34_value);
    			div16_nodes.forEach(detach);
    			t35 = claim_text(div22_nodes, "\n                    ");

    			div21 = claim_element(div22_nodes, "DIV", { class: true }, false);
    			var div21_nodes = children(div21);

    			div17 = claim_element(div21_nodes, "DIV", { class: true }, false);
    			var div17_nodes = children(div17);

    			input4.$$.fragment.l(div17_nodes);
    			div17_nodes.forEach(detach);
    			t36 = claim_text(div21_nodes, "\n                        ");

    			div18 = claim_element(div21_nodes, "DIV", { class: true }, false);
    			var div18_nodes = children(div18);

    			input5.$$.fragment.l(div18_nodes);
    			div18_nodes.forEach(detach);
    			t37 = claim_text(div21_nodes, "\n                        ");

    			div20 = claim_element(div21_nodes, "DIV", { class: true }, false);
    			var div20_nodes = children(div20);

    			span7 = claim_element(div20_nodes, "SPAN", {}, false);
    			var span7_nodes = children(span7);

    			t38 = claim_text(span7_nodes, t38_value);
    			span7_nodes.forEach(detach);
    			t39 = claim_text(div20_nodes, "\n                            ");

    			div19 = claim_element(div20_nodes, "DIV", { class: true }, false);
    			var div19_nodes = children(div19);

    			select2 = claim_element(div19_nodes, "SELECT", { class: true }, false);
    			var select2_nodes = children(select2);

    			option5 = claim_element(select2_nodes, "OPTION", { value: true, class: true }, false);
    			var option5_nodes = children(option5);

    			t40 = claim_text(option5_nodes, t40_value);
    			option5_nodes.forEach(detach);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(select2_nodes);
    			}

    			select2_nodes.forEach(detach);
    			div19_nodes.forEach(detach);
    			div20_nodes.forEach(detach);
    			div21_nodes.forEach(detach);
    			div22_nodes.forEach(detach);
    			t41 = claim_text(div27_nodes, "\n                ");

    			div26 = claim_element(div27_nodes, "DIV", { class: true }, false);
    			var div26_nodes = children(div26);

    			div23 = claim_element(div26_nodes, "DIV", { class: true }, false);
    			var div23_nodes = children(div23);

    			t42 = claim_text(div23_nodes, t42_value);
    			div23_nodes.forEach(detach);
    			t43 = claim_text(div26_nodes, "\n                    ");

    			div25 = claim_element(div26_nodes, "DIV", { class: true }, false);
    			var div25_nodes = children(div25);

    			span8 = claim_element(div25_nodes, "SPAN", {}, false);
    			var span8_nodes = children(span8);

    			t44 = claim_text(span8_nodes, t44_value);
    			span8_nodes.forEach(detach);
    			t45 = claim_text(div25_nodes, "\n                        ");

    			div24 = claim_element(div25_nodes, "DIV", { class: true }, false);
    			var div24_nodes = children(div24);

    			select3 = claim_element(div24_nodes, "SELECT", { class: true }, false);
    			var select3_nodes = children(select3);

    			option6 = claim_element(select3_nodes, "OPTION", { value: true, class: true }, false);
    			var option6_nodes = children(option6);

    			t46 = claim_text(option6_nodes, t46_value);
    			option6_nodes.forEach(detach);

    			option7 = claim_element(select3_nodes, "OPTION", { value: true, class: true }, false);
    			var option7_nodes = children(option7);

    			t47 = claim_text(option7_nodes, t47_value);
    			option7_nodes.forEach(detach);

    			option8 = claim_element(select3_nodes, "OPTION", { value: true, class: true }, false);
    			var option8_nodes = children(option8);

    			t48 = claim_text(option8_nodes, t48_value);
    			option8_nodes.forEach(detach);

    			option9 = claim_element(select3_nodes, "OPTION", { value: true, class: true }, false);
    			var option9_nodes = children(option9);

    			t49 = claim_text(option9_nodes, t49_value);
    			option9_nodes.forEach(detach);

    			option10 = claim_element(select3_nodes, "OPTION", { value: true, class: true }, false);
    			var option10_nodes = children(option10);

    			t50 = claim_text(option10_nodes, t50_value);
    			option10_nodes.forEach(detach);

    			option11 = claim_element(select3_nodes, "OPTION", { value: true, class: true }, false);
    			var option11_nodes = children(option11);

    			t51 = claim_text(option11_nodes, t51_value);
    			option11_nodes.forEach(detach);

    			option12 = claim_element(select3_nodes, "OPTION", { value: true, class: true }, false);
    			var option12_nodes = children(option12);

    			t52 = claim_text(option12_nodes, t52_value);
    			option12_nodes.forEach(detach);

    			option13 = claim_element(select3_nodes, "OPTION", { value: true, class: true }, false);
    			var option13_nodes = children(option13);

    			t53 = claim_text(option13_nodes, t53_value);
    			option13_nodes.forEach(detach);

    			option14 = claim_element(select3_nodes, "OPTION", { value: true, class: true }, false);
    			var option14_nodes = children(option14);

    			t54 = claim_text(option14_nodes, t54_value);
    			option14_nodes.forEach(detach);

    			option15 = claim_element(select3_nodes, "OPTION", { value: true, class: true }, false);
    			var option15_nodes = children(option15);

    			t55 = claim_text(option15_nodes, t55_value);
    			option15_nodes.forEach(detach);
    			select3_nodes.forEach(detach);
    			div24_nodes.forEach(detach);
    			div25_nodes.forEach(detach);
    			t56 = claim_text(div26_nodes, "\n                    ");
    			if (if_block2) if_block2.l(div26_nodes);
    			div26_nodes.forEach(detach);
    			t57 = claim_text(div27_nodes, "\n                ");
    			if (if_block3) if_block3.l(div27_nodes);
    			div27_nodes.forEach(detach);
    			div28_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			attr(div0, "class", "section-header svelte-4a9i7k");
    			add_location(div0, file$3, 130, 20, 3878);
    			add_location(span0, file$3, 132, 24, 3994);
    			attr(div1, "class", "input-wrapper svelte-4a9i7k");
    			add_location(div1, file$3, 133, 24, 4046);
    			add_location(span1, file$3, 140, 24, 4363);
    			attr(div2, "class", "section-field svelte-4a9i7k");
    			add_location(div2, file$3, 131, 20, 3942);
    			add_location(span2, file$3, 143, 24, 4531);
    			option0.__value = "null";
    			option0.value = option0.__value;
    			attr(option0, "class", "svelte-4a9i7k");
    			add_location(option0, file$3, 146, 32, 4718);
    			attr(optgroup0, "label", optgroup0_label_value = M.periodic_beat);
    			add_location(optgroup0, file$3, 147, 32, 4791);
    			option1.__value = "'brown-noise'";
    			option1.value = option1.__value;
    			attr(option1, "class", "svelte-4a9i7k");
    			add_location(option1, file$3, 153, 32, 5167);
    			option2.__value = "'pink-noise'";
    			option2.value = option2.__value;
    			attr(option2, "class", "svelte-4a9i7k");
    			add_location(option2, file$3, 154, 32, 5256);
    			option3.__value = "'white-noise'";
    			option3.value = option3.__value;
    			attr(option3, "class", "svelte-4a9i7k");
    			add_location(option3, file$3, 155, 32, 5343);
    			attr(optgroup1, "label", optgroup1_label_value = M.noise);
    			add_location(optgroup1, file$3, 152, 32, 5106);
    			if (ctx.focusTimerSound === void 0) add_render_callback(() => ctx.select0_change_handler.call(select0));
    			attr(select0, "class", "svelte-4a9i7k");
    			add_location(select0, file$3, 145, 28, 4648);
    			attr(div3, "class", "input-wrapper svelte-4a9i7k");
    			add_location(div3, file$3, 144, 24, 4592);
    			add_location(span3, file$3, 159, 24, 5537);
    			attr(div4, "class", "section-field svelte-4a9i7k");
    			add_location(div4, file$3, 142, 20, 4479);
    			attr(div5, "class", "section-field svelte-4a9i7k");
    			add_location(div5, file$3, 169, 20, 6066);
    			attr(div6, "class", "section-field svelte-4a9i7k");
    			add_location(div6, file$3, 181, 20, 6633);
    			attr(div7, "class", "section-field svelte-4a9i7k");
    			add_location(div7, file$3, 185, 24, 6809);
    			attr(div8, "class", "section-field svelte-4a9i7k");
    			add_location(div8, file$3, 191, 24, 7132);
    			add_location(span4, file$3, 198, 28, 7506);
    			option4.__value = "null";
    			option4.value = option4.__value;
    			attr(option4, "class", "svelte-4a9i7k");
    			add_location(option4, file$3, 203, 36, 7853);
    			if (ctx.settings.focus.notifications.sound === void 0) add_render_callback(() => ctx.select1_change_handler.call(select1));
    			attr(select1, "class", "svelte-4a9i7k");
    			add_location(select1, file$3, 200, 32, 7637);
    			attr(div9, "class", "input-wrapper svelte-4a9i7k");
    			add_location(div9, file$3, 199, 28, 7577);
    			attr(div10, "class", "section-field svelte-4a9i7k");
    			add_location(div10, file$3, 197, 24, 7450);
    			attr(div11, "class", "section-field-group svelte-4a9i7k");
    			add_location(div11, file$3, 184, 20, 6751);
    			attr(div12, "class", "section svelte-4a9i7k");
    			add_location(div12, file$3, 129, 16, 3836);
    			attr(div13, "class", "section-header svelte-4a9i7k");
    			add_location(div13, file$3, 213, 20, 8318);
    			add_location(span5, file$3, 215, 24, 8442);
    			attr(div14, "class", "input-wrapper svelte-4a9i7k");
    			add_location(div14, file$3, 216, 24, 8494);
    			add_location(span6, file$3, 223, 24, 8816);
    			attr(div15, "class", "section-field svelte-4a9i7k");
    			add_location(div15, file$3, 214, 20, 8390);
    			attr(div16, "class", "section-field svelte-4a9i7k");
    			add_location(div16, file$3, 225, 20, 8936);
    			attr(div17, "class", "section-field svelte-4a9i7k");
    			add_location(div17, file$3, 227, 24, 9067);
    			attr(div18, "class", "section-field svelte-4a9i7k");
    			add_location(div18, file$3, 233, 24, 9394);
    			add_location(span7, file$3, 240, 28, 9775);
    			option5.__value = "null";
    			option5.value = option5.__value;
    			attr(option5, "class", "svelte-4a9i7k");
    			add_location(option5, file$3, 245, 36, 10127);
    			if (ctx.settings.shortBreak.notifications.sound === void 0) add_render_callback(() => ctx.select2_change_handler.call(select2));
    			attr(select2, "class", "svelte-4a9i7k");
    			add_location(select2, file$3, 242, 32, 9906);
    			attr(div19, "class", "input-wrapper svelte-4a9i7k");
    			add_location(div19, file$3, 241, 28, 9846);
    			attr(div20, "class", "section-field svelte-4a9i7k");
    			add_location(div20, file$3, 239, 24, 9719);
    			attr(div21, "class", "section-field-group svelte-4a9i7k");
    			add_location(div21, file$3, 226, 20, 9009);
    			attr(div22, "class", "section svelte-4a9i7k");
    			add_location(div22, file$3, 212, 16, 8276);
    			attr(div23, "class", "section-header svelte-4a9i7k");
    			add_location(div23, file$3, 255, 20, 10592);
    			add_location(span8, file$3, 257, 24, 10715);
    			option6.__value = "0";
    			option6.value = option6.__value;
    			attr(option6, "class", "svelte-4a9i7k");
    			add_location(option6, file$3, 260, 32, 10922);
    			option7.__value = "2";
    			option7.value = option7.__value;
    			attr(option7, "class", "svelte-4a9i7k");
    			add_location(option7, file$3, 261, 32, 10993);
    			option8.__value = "3";
    			option8.value = option8.__value;
    			attr(option8, "class", "svelte-4a9i7k");
    			add_location(option8, file$3, 262, 32, 11074);
    			option9.__value = "4";
    			option9.value = option9.__value;
    			attr(option9, "class", "svelte-4a9i7k");
    			add_location(option9, file$3, 263, 32, 11155);
    			option10.__value = "5";
    			option10.value = option10.__value;
    			attr(option10, "class", "svelte-4a9i7k");
    			add_location(option10, file$3, 264, 32, 11236);
    			option11.__value = "6";
    			option11.value = option11.__value;
    			attr(option11, "class", "svelte-4a9i7k");
    			add_location(option11, file$3, 265, 32, 11317);
    			option12.__value = "7";
    			option12.value = option12.__value;
    			attr(option12, "class", "svelte-4a9i7k");
    			add_location(option12, file$3, 266, 32, 11398);
    			option13.__value = "8";
    			option13.value = option13.__value;
    			attr(option13, "class", "svelte-4a9i7k");
    			add_location(option13, file$3, 267, 32, 11479);
    			option14.__value = "9";
    			option14.value = option14.__value;
    			attr(option14, "class", "svelte-4a9i7k");
    			add_location(option14, file$3, 268, 32, 11560);
    			option15.__value = "10";
    			option15.value = option15.__value;
    			attr(option15, "class", "svelte-4a9i7k");
    			add_location(option15, file$3, 269, 32, 11641);
    			if (ctx.settings.longBreak.interval === void 0) add_render_callback(() => ctx.select3_change_handler.call(select3));
    			attr(select3, "class", "svelte-4a9i7k");
    			add_location(select3, file$3, 259, 28, 10840);
    			attr(div24, "class", "input-wrapper svelte-4a9i7k");
    			add_location(div24, file$3, 258, 24, 10784);
    			attr(div25, "class", "section-field svelte-4a9i7k");
    			add_location(div25, file$3, 256, 20, 10663);
    			attr(div26, "class", "section svelte-4a9i7k");
    			add_location(div26, file$3, 254, 16, 10550);
    			attr(div27, "class", "content-wrapper svelte-4a9i7k");
    			add_location(div27, file$3, 128, 12, 3790);
    			attr(div28, "class", "main svelte-4a9i7k");
    			add_location(div28, file$3, 127, 8, 3759);

    			dispose = [
    				listen(select0, "change", ctx.select0_change_handler),
    				listen(select1, "change", ctx.select1_change_handler),
    				listen(select1, "input", ctx.input_handler),
    				listen(select2, "change", ctx.select2_change_handler),
    				listen(select2, "input", ctx.input_handler_1),
    				listen(select3, "change", ctx.select3_change_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, div28, anchor);
    			append(div28, div27);
    			append(div27, div12);
    			append(div12, div0);
    			append(div0, t0);
    			append(div12, t1);
    			append(div12, div2);
    			append(div2, span0);
    			append(span0, t2);
    			append(div2, t3);
    			append(div2, div1);
    			mount_component(input0, div1, null);
    			append(div2, t4);
    			append(div2, span1);
    			append(span1, t5);
    			append(div12, t6);
    			append(div12, div4);
    			append(div4, span2);
    			append(span2, t7);
    			append(div4, t8);
    			append(div4, div3);
    			append(div3, select0);
    			append(select0, option0);
    			append(option0, t9);
    			append(select0, optgroup0);

    			for (var i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(optgroup0, null);
    			}

    			append(select0, optgroup1);
    			append(optgroup1, option1);
    			append(option1, t10);
    			append(optgroup1, option2);
    			append(option2, t11);
    			append(optgroup1, option3);
    			append(option3, t12);

    			select_option(select0, ctx.focusTimerSound);

    			append(div4, t13);
    			append(div4, span3);
    			append(span3, t14);
    			append(span3, t15);
    			append(div4, t16);
    			if (if_block0) if_block0.m(div4, null);
    			append(div12, t17);
    			append(div12, div5);
    			if (if_block1) if_block1.m(div5, null);
    			append(div12, t18);
    			append(div12, div6);
    			append(div6, t19);
    			append(div12, t20);
    			append(div12, div11);
    			append(div11, div7);
    			mount_component(input1, div7, null);
    			append(div11, t21);
    			append(div11, div8);
    			mount_component(input2, div8, null);
    			append(div11, t22);
    			append(div11, div10);
    			append(div10, span4);
    			append(span4, t23);
    			append(div10, t24);
    			append(div10, div9);
    			append(div9, select1);
    			append(select1, option4);
    			append(option4, t25);

    			for (var i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select1, null);
    			}

    			select_option(select1, ctx.settings.focus.notifications.sound);

    			append(div27, t26);
    			append(div27, div22);
    			append(div22, div13);
    			append(div13, t27);
    			append(div22, t28);
    			append(div22, div15);
    			append(div15, span5);
    			append(span5, t29);
    			append(div15, t30);
    			append(div15, div14);
    			mount_component(input3, div14, null);
    			append(div15, t31);
    			append(div15, span6);
    			append(span6, t32);
    			append(div22, t33);
    			append(div22, div16);
    			append(div16, t34);
    			append(div22, t35);
    			append(div22, div21);
    			append(div21, div17);
    			mount_component(input4, div17, null);
    			append(div21, t36);
    			append(div21, div18);
    			mount_component(input5, div18, null);
    			append(div21, t37);
    			append(div21, div20);
    			append(div20, span7);
    			append(span7, t38);
    			append(div20, t39);
    			append(div20, div19);
    			append(div19, select2);
    			append(select2, option5);
    			append(option5, t40);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select2, null);
    			}

    			select_option(select2, ctx.settings.shortBreak.notifications.sound);

    			append(div27, t41);
    			append(div27, div26);
    			append(div26, div23);
    			append(div23, t42);
    			append(div26, t43);
    			append(div26, div25);
    			append(div25, span8);
    			append(span8, t44);
    			append(div25, t45);
    			append(div25, div24);
    			append(div24, select3);
    			append(select3, option6);
    			append(option6, t46);
    			append(select3, option7);
    			append(option7, t47);
    			append(select3, option8);
    			append(option8, t48);
    			append(select3, option9);
    			append(option9, t49);
    			append(select3, option10);
    			append(option10, t50);
    			append(select3, option11);
    			append(option11, t51);
    			append(select3, option12);
    			append(option12, t52);
    			append(select3, option13);
    			append(option13, t53);
    			append(select3, option14);
    			append(option14, t54);
    			append(select3, option15);
    			append(option15, t55);

    			select_option(select3, ctx.settings.longBreak.interval);

    			append(div26, t56);
    			if (if_block2) if_block2.m(div26, null);
    			append(div27, t57);
    			if (if_block3) if_block3.m(div27, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var input0_changes = {};
    			if (!updating_value && changed.settings) {
    				input0_changes.value = ctx.settings.focus.duration;
    			}
    			input0.$set(input0_changes);

    			if ((!current || changed.settings) && t5_value !== (t5_value = ctx.settings.focus.duration == 1 ? M.minute: M.minutes)) {
    				set_data(t5, t5_value);
    			}

    			if (changed.timerSounds) {
    				each_value_3 = ctx.timerSounds;

    				for (var i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(changed, child_ctx);
    					} else {
    						each_blocks_2[i] = create_each_block_3(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(optgroup0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}
    				each_blocks_2.length = each_value_3.length;
    			}

    			if (changed.focusTimerSound) select_option(select0, ctx.focusTimerSound);

    			if (ctx.canPlayTimerSound) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div4, null);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (ctx.focusTimerBPM != null) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div5, null);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}

    			var input1_changes = {};
    			if (changed.M) input1_changes.label = M.show_desktop_notification;
    			if (!updating_checked && changed.settings) {
    				input1_changes.checked = ctx.settings.focus.notifications.desktop;
    			}
    			input1.$set(input1_changes);

    			var input2_changes = {};
    			if (changed.M) input2_changes.label = M.show_new_tab_notification;
    			if (!updating_checked_1 && changed.settings) {
    				input2_changes.checked = ctx.settings.focus.notifications.tab;
    			}
    			input2.$set(input2_changes);

    			if (changed.notificationSounds) {
    				each_value_2 = ctx.notificationSounds;

    				for (var i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(changed, child_ctx);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}
    				each_blocks_1.length = each_value_2.length;
    			}

    			if (changed.settings) select_option(select1, ctx.settings.focus.notifications.sound);

    			var input3_changes = {};
    			if (!updating_value_1 && changed.settings) {
    				input3_changes.value = ctx.settings.shortBreak.duration;
    			}
    			input3.$set(input3_changes);

    			if ((!current || changed.settings) && t32_value !== (t32_value = ctx.settings.shortBreak.duration == 1 ? M.minute: M.minutes)) {
    				set_data(t32, t32_value);
    			}

    			var input4_changes = {};
    			if (changed.M) input4_changes.label = M.show_desktop_notification;
    			if (!updating_checked_2 && changed.settings) {
    				input4_changes.checked = ctx.settings.shortBreak.notifications.desktop;
    			}
    			input4.$set(input4_changes);

    			var input5_changes = {};
    			if (changed.M) input5_changes.label = M.show_new_tab_notification;
    			if (!updating_checked_3 && changed.settings) {
    				input5_changes.checked = ctx.settings.shortBreak.notifications.tab;
    			}
    			input5.$set(input5_changes);

    			if (changed.notificationSounds) {
    				each_value_1 = ctx.notificationSounds;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value_1.length;
    			}

    			if (changed.settings) select_option(select2, ctx.settings.shortBreak.notifications.sound);
    			if (changed.settings) select_option(select3, ctx.settings.longBreak.interval);

    			if (ctx.settings.longBreak.interval != 0) {
    				if (if_block2) {
    					if_block2.p(changed, ctx);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block_2$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div26, null);
    				}
    			} else if (if_block2) {
    				group_outros();
    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});
    				check_outros();
    			}

    			if (ctx.showSettingsSaved) {
    				if (if_block3) {
    					if_block3.p(changed, ctx);
    				} else {
    					if_block3 = create_if_block_1$1(ctx);
    					if_block3.c();
    					if_block3.m(div27, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);

    			transition_in(if_block0);
    			transition_in(if_block1);

    			transition_in(input1.$$.fragment, local);

    			transition_in(input2.$$.fragment, local);

    			transition_in(input3.$$.fragment, local);

    			transition_in(input4.$$.fragment, local);

    			transition_in(input5.$$.fragment, local);

    			transition_in(if_block2);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);
    			transition_out(if_block2);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div28);
    			}

    			destroy_component(input0);

    			destroy_each(each_blocks_2, detaching);

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();

    			destroy_component(input1);

    			destroy_component(input2);

    			destroy_each(each_blocks_1, detaching);

    			destroy_component(input3);

    			destroy_component(input4);

    			destroy_component(input5);

    			destroy_each(each_blocks, detaching);

    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			run_all(dispose);
    		}
    	};
    }

    // (149:36) {#each timerSounds as sound}
    function create_each_block_3(ctx) {
    	var option, t_value = ctx.sound.name, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			this.h();
    		},

    		l: function claim(nodes) {
    			option = claim_element(nodes, "OPTION", { value: true, class: true }, false);
    			var option_nodes = children(option);

    			t = claim_text(option_nodes, t_value);
    			option_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			option.__value = option_value_value = ctx.sound.files;
    			option.value = option.__value;
    			attr(option, "class", "svelte-4a9i7k");
    			add_location(option, file$3, 149, 40, 4933);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.timerSounds) && t_value !== (t_value = ctx.sound.name)) {
    				set_data(t, t_value);
    			}

    			if ((changed.timerSounds) && option_value_value !== (option_value_value = ctx.sound.files)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (161:24) {#if canPlayTimerSound}
    function create_if_block_4(ctx) {
    	var span1, t0, span0, t1, t2_value = M.hover_preview, t2, t3, current, dispose;

    	var icon = new Icon({
    		props: { icon: "volume-high" },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			span1 = element("span");
    			t0 = text("(\n                                    ");
    			span0 = element("span");
    			icon.$$.fragment.c();
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = text("\n                                )");
    			this.h();
    		},

    		l: function claim(nodes) {
    			span1 = claim_element(nodes, "SPAN", { class: true }, false);
    			var span1_nodes = children(span1);

    			t0 = claim_text(span1_nodes, "(\n                                    ");

    			span0 = claim_element(span1_nodes, "SPAN", { class: true }, false);
    			var span0_nodes = children(span0);

    			icon.$$.fragment.l(span0_nodes);
    			span0_nodes.forEach(detach);
    			t1 = claim_text(span1_nodes, " \n                                    ");
    			t2 = claim_text(span1_nodes, t2_value);
    			t3 = claim_text(span1_nodes, "\n                                )");
    			span1_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			attr(span0, "class", "icon svelte-4a9i7k");
    			add_location(span0, file$3, 163, 36, 5809);
    			attr(span1, "class", "preview svelte-4a9i7k");
    			add_location(span1, file$3, 161, 28, 5657);

    			dispose = [
    				listen(span1, "mouseover", ctx.playTimerSound),
    				listen(span1, "mouseout", ctx.stopTimerSound)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, span1, anchor);
    			append(span1, t0);
    			append(span1, span0);
    			mount_component(icon, span0, null);
    			append(span1, t1);
    			append(span1, t2);
    			append(span1, t3);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span1);
    			}

    			destroy_component(icon);

    			run_all(dispose);
    		}
    	};
    }

    // (171:24) {#if focusTimerBPM != null}
    function create_if_block_3(ctx) {
    	var span0, t0_value = M.speed_label, t0, t1, div, updating_value, t2, span1, t3_value = M.bpm, t3, current;

    	function input_value_binding(value) {
    		ctx.input_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let input_props = { type: "number", min: "1", max: "1000" };
    	if (ctx.focusTimerBPM !== void 0) {
    		input_props.value = ctx.focusTimerBPM;
    	}
    	var input = new Input({ props: input_props, $$inline: true });

    	binding_callbacks.push(() => bind(input, 'value', input_value_binding));

    	return {
    		c: function create() {
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			div = element("div");
    			input.$$.fragment.c();
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			this.h();
    		},

    		l: function claim(nodes) {
    			span0 = claim_element(nodes, "SPAN", {}, false);
    			var span0_nodes = children(span0);

    			t0 = claim_text(span0_nodes, t0_value);
    			span0_nodes.forEach(detach);
    			t1 = claim_text(nodes, "\n                            ");

    			div = claim_element(nodes, "DIV", { class: true }, false);
    			var div_nodes = children(div);

    			input.$$.fragment.l(div_nodes);
    			div_nodes.forEach(detach);
    			t2 = claim_text(nodes, "\n                            ");

    			span1 = claim_element(nodes, "SPAN", {}, false);
    			var span1_nodes = children(span1);

    			t3 = claim_text(span1_nodes, t3_value);
    			span1_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			add_location(span0, file$3, 171, 28, 6174);
    			attr(div, "class", "input-wrapper svelte-4a9i7k");
    			add_location(div, file$3, 172, 28, 6233);
    			add_location(span1, file$3, 178, 28, 6533);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span0, anchor);
    			append(span0, t0);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);
    			mount_component(input, div, null);
    			insert(target, t2, anchor);
    			insert(target, span1, anchor);
    			append(span1, t3);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var input_changes = {};
    			if (!updating_value && changed.focusTimerBPM) {
    				input_changes.value = ctx.focusTimerBPM;
    			}
    			input.$set(input_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span0);
    				detach(t1);
    				detach(div);
    			}

    			destroy_component(input);

    			if (detaching) {
    				detach(t2);
    				detach(span1);
    			}
    		}
    	};
    }

    // (205:36) {#each notificationSounds as sound}
    function create_each_block_2(ctx) {
    	var option, t_value = ctx.sound.name, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			this.h();
    		},

    		l: function claim(nodes) {
    			option = claim_element(nodes, "OPTION", { value: true, class: true }, false);
    			var option_nodes = children(option);

    			t = claim_text(option_nodes, t_value);
    			option_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			option.__value = option_value_value = ctx.sound.file;
    			option.value = option.__value;
    			attr(option, "class", "svelte-4a9i7k");
    			add_location(option, file$3, 205, 40, 8006);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.notificationSounds) && t_value !== (t_value = ctx.sound.name)) {
    				set_data(t, t_value);
    			}

    			if ((changed.notificationSounds) && option_value_value !== (option_value_value = ctx.sound.file)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (247:36) {#each notificationSounds as sound}
    function create_each_block_1(ctx) {
    	var option, t_value = ctx.sound.name, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			this.h();
    		},

    		l: function claim(nodes) {
    			option = claim_element(nodes, "OPTION", { value: true, class: true }, false);
    			var option_nodes = children(option);

    			t = claim_text(option_nodes, t_value);
    			option_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			option.__value = option_value_value = ctx.sound.file;
    			option.value = option.__value;
    			attr(option, "class", "svelte-4a9i7k");
    			add_location(option, file$3, 247, 40, 10280);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.notificationSounds) && t_value !== (t_value = ctx.sound.name)) {
    				set_data(t, t_value);
    			}

    			if ((changed.notificationSounds) && option_value_value !== (option_value_value = ctx.sound.file)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (274:20) {#if settings.longBreak.interval != 0}
    function create_if_block_2$1(ctx) {
    	var div1, span0, t0_value = M.duration, t0, t1, div0, updating_value, t2, span1, t3_value = ctx.settings.longBreak.duration == 1 ? M.minute: M.minutes, t3, t4, div2, t5_value = M.when_complete, t5, t6, div7, div3, updating_checked, t7, span2, t8_value = M.show_desktop_notification, t8, t9, div4, updating_checked_1, t10, span3, t11_value = M.show_new_tab_notification, t11, t12, div6, span4, t13_value = M.play_audio_notification, t13, t14, div5, select, option, t15_value = M.none, t15, current, dispose;

    	function input0_value_binding_1(value) {
    		ctx.input0_value_binding_1.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let input0_props = { type: "number", min: "1", max: "999" };
    	if (ctx.settings.longBreak.duration !== void 0) {
    		input0_props.value = ctx.settings.longBreak.duration;
    	}
    	var input0 = new Input({ props: input0_props, $$inline: true });

    	binding_callbacks.push(() => bind(input0, 'value', input0_value_binding_1));

    	function input1_checked_binding_1(value_1) {
    		ctx.input1_checked_binding_1.call(null, value_1);
    		updating_checked = true;
    		add_flush_callback(() => updating_checked = false);
    	}

    	let input1_props = { type: "checkbox" };
    	if (ctx.settings.longBreak.notifications.desktop !== void 0) {
    		input1_props.checked = ctx.settings.longBreak.notifications.desktop;
    	}
    	var input1 = new Input({ props: input1_props, $$inline: true });

    	binding_callbacks.push(() => bind(input1, 'checked', input1_checked_binding_1));

    	function input2_checked_binding_1(value_2) {
    		ctx.input2_checked_binding_1.call(null, value_2);
    		updating_checked_1 = true;
    		add_flush_callback(() => updating_checked_1 = false);
    	}

    	let input2_props = { type: "checkbox" };
    	if (ctx.settings.longBreak.notifications.tab !== void 0) {
    		input2_props.checked = ctx.settings.longBreak.notifications.tab;
    	}
    	var input2 = new Input({ props: input2_props, $$inline: true });

    	binding_callbacks.push(() => bind(input2, 'checked', input2_checked_binding_1));

    	var each_value = ctx.notificationSounds;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div1 = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			input0.$$.fragment.c();
    			t2 = space();
    			span1 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			div2 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			div7 = element("div");
    			div3 = element("div");
    			input1.$$.fragment.c();
    			t7 = space();
    			span2 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			div4 = element("div");
    			input2.$$.fragment.c();
    			t10 = space();
    			span3 = element("span");
    			t11 = text(t11_value);
    			t12 = space();
    			div6 = element("div");
    			span4 = element("span");
    			t13 = text(t13_value);
    			t14 = space();
    			div5 = element("div");
    			select = element("select");
    			option = element("option");
    			t15 = text(t15_value);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			this.h();
    		},

    		l: function claim(nodes) {
    			div1 = claim_element(nodes, "DIV", { class: true }, false);
    			var div1_nodes = children(div1);

    			span0 = claim_element(div1_nodes, "SPAN", {}, false);
    			var span0_nodes = children(span0);

    			t0 = claim_text(span0_nodes, t0_value);
    			span0_nodes.forEach(detach);
    			t1 = claim_text(div1_nodes, "\n                            ");

    			div0 = claim_element(div1_nodes, "DIV", { class: true }, false);
    			var div0_nodes = children(div0);

    			input0.$$.fragment.l(div0_nodes);
    			div0_nodes.forEach(detach);
    			t2 = claim_text(div1_nodes, "\n                            ");

    			span1 = claim_element(div1_nodes, "SPAN", {}, false);
    			var span1_nodes = children(span1);

    			t3 = claim_text(span1_nodes, t3_value);
    			span1_nodes.forEach(detach);
    			div1_nodes.forEach(detach);
    			t4 = claim_text(nodes, "\n                        ");

    			div2 = claim_element(nodes, "DIV", { class: true }, false);
    			var div2_nodes = children(div2);

    			t5 = claim_text(div2_nodes, t5_value);
    			div2_nodes.forEach(detach);
    			t6 = claim_text(nodes, "\n                        ");

    			div7 = claim_element(nodes, "DIV", { class: true }, false);
    			var div7_nodes = children(div7);

    			div3 = claim_element(div7_nodes, "DIV", { class: true }, false);
    			var div3_nodes = children(div3);

    			input1.$$.fragment.l(div3_nodes);
    			t7 = claim_text(div3_nodes, "\n                                ");

    			span2 = claim_element(div3_nodes, "SPAN", {}, false);
    			var span2_nodes = children(span2);

    			t8 = claim_text(span2_nodes, t8_value);
    			span2_nodes.forEach(detach);
    			div3_nodes.forEach(detach);
    			t9 = claim_text(div7_nodes, "\n                            ");

    			div4 = claim_element(div7_nodes, "DIV", { class: true }, false);
    			var div4_nodes = children(div4);

    			input2.$$.fragment.l(div4_nodes);
    			t10 = claim_text(div4_nodes, "\n                                ");

    			span3 = claim_element(div4_nodes, "SPAN", {}, false);
    			var span3_nodes = children(span3);

    			t11 = claim_text(span3_nodes, t11_value);
    			span3_nodes.forEach(detach);
    			div4_nodes.forEach(detach);
    			t12 = claim_text(div7_nodes, "\n                            ");

    			div6 = claim_element(div7_nodes, "DIV", { class: true }, false);
    			var div6_nodes = children(div6);

    			span4 = claim_element(div6_nodes, "SPAN", {}, false);
    			var span4_nodes = children(span4);

    			t13 = claim_text(span4_nodes, t13_value);
    			span4_nodes.forEach(detach);
    			t14 = claim_text(div6_nodes, "\n                                ");

    			div5 = claim_element(div6_nodes, "DIV", { class: true }, false);
    			var div5_nodes = children(div5);

    			select = claim_element(div5_nodes, "SELECT", { class: true }, false);
    			var select_nodes = children(select);

    			option = claim_element(select_nodes, "OPTION", { value: true, class: true }, false);
    			var option_nodes = children(option);

    			t15 = claim_text(option_nodes, t15_value);
    			option_nodes.forEach(detach);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].l(select_nodes);
    			}

    			select_nodes.forEach(detach);
    			div5_nodes.forEach(detach);
    			div6_nodes.forEach(detach);
    			div7_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			add_location(span0, file$3, 275, 28, 11927);
    			attr(div0, "class", "input-wrapper svelte-4a9i7k");
    			add_location(div0, file$3, 276, 28, 11983);
    			add_location(span1, file$3, 284, 28, 12369);
    			attr(div1, "class", "section-field svelte-4a9i7k");
    			add_location(div1, file$3, 274, 24, 11871);
    			attr(div2, "class", "section-field svelte-4a9i7k");
    			add_location(div2, file$3, 286, 24, 12496);
    			add_location(span2, file$3, 292, 32, 12882);
    			attr(div3, "class", "section-field svelte-4a9i7k");
    			add_location(div3, file$3, 288, 28, 12635);
    			add_location(span3, file$3, 298, 32, 13233);
    			attr(div4, "class", "section-field svelte-4a9i7k");
    			add_location(div4, file$3, 294, 28, 12990);
    			add_location(span4, file$3, 301, 32, 13401);
    			option.__value = "null";
    			option.value = option.__value;
    			attr(option, "class", "svelte-4a9i7k");
    			add_location(option, file$3, 306, 40, 13772);
    			if (ctx.settings.longBreak.notifications.sound === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			attr(select, "class", "svelte-4a9i7k");
    			add_location(select, file$3, 303, 36, 13540);
    			attr(div5, "class", "input-wrapper svelte-4a9i7k");
    			add_location(div5, file$3, 302, 32, 13476);
    			attr(div6, "class", "section-field svelte-4a9i7k");
    			add_location(div6, file$3, 300, 28, 13341);
    			attr(div7, "class", "section-field-group svelte-4a9i7k");
    			add_location(div7, file$3, 287, 24, 12573);

    			dispose = [
    				listen(select, "change", ctx.select_change_handler),
    				listen(select, "input", ctx.input_handler_2)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, span0);
    			append(span0, t0);
    			append(div1, t1);
    			append(div1, div0);
    			mount_component(input0, div0, null);
    			append(div1, t2);
    			append(div1, span1);
    			append(span1, t3);
    			insert(target, t4, anchor);
    			insert(target, div2, anchor);
    			append(div2, t5);
    			insert(target, t6, anchor);
    			insert(target, div7, anchor);
    			append(div7, div3);
    			mount_component(input1, div3, null);
    			append(div3, t7);
    			append(div3, span2);
    			append(span2, t8);
    			append(div7, t9);
    			append(div7, div4);
    			mount_component(input2, div4, null);
    			append(div4, t10);
    			append(div4, span3);
    			append(span3, t11);
    			append(div7, t12);
    			append(div7, div6);
    			append(div6, span4);
    			append(span4, t13);
    			append(div6, t14);
    			append(div6, div5);
    			append(div5, select);
    			append(select, option);
    			append(option, t15);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.settings.longBreak.notifications.sound);

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var input0_changes = {};
    			if (!updating_value && changed.settings) {
    				input0_changes.value = ctx.settings.longBreak.duration;
    			}
    			input0.$set(input0_changes);

    			if ((!current || changed.settings) && t3_value !== (t3_value = ctx.settings.longBreak.duration == 1 ? M.minute: M.minutes)) {
    				set_data(t3, t3_value);
    			}

    			var input1_changes = {};
    			if (!updating_checked && changed.settings) {
    				input1_changes.checked = ctx.settings.longBreak.notifications.desktop;
    			}
    			input1.$set(input1_changes);

    			var input2_changes = {};
    			if (!updating_checked_1 && changed.settings) {
    				input2_changes.checked = ctx.settings.longBreak.notifications.tab;
    			}
    			input2.$set(input2_changes);

    			if (changed.notificationSounds) {
    				each_value = ctx.notificationSounds;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.settings) select_option(select, ctx.settings.longBreak.notifications.sound);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);

    			transition_in(input1.$$.fragment, local);

    			transition_in(input2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			destroy_component(input0);

    			if (detaching) {
    				detach(t4);
    				detach(div2);
    				detach(t6);
    				detach(div7);
    			}

    			destroy_component(input1);

    			destroy_component(input2);

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    }

    // (308:40) {#each notificationSounds as sound}
    function create_each_block(ctx) {
    	var option, t_value = ctx.sound.name, t, option_value_value;

    	return {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			this.h();
    		},

    		l: function claim(nodes) {
    			option = claim_element(nodes, "OPTION", { value: true, class: true }, false);
    			var option_nodes = children(option);

    			t = claim_text(option_nodes, t_value);
    			option_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			option.__value = option_value_value = ctx.sound.file;
    			option.value = option.__value;
    			attr(option, "class", "svelte-4a9i7k");
    			add_location(option, file$3, 308, 44, 13933);
    		},

    		m: function mount(target, anchor) {
    			insert(target, option, anchor);
    			append(option, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.notificationSounds) && t_value !== (t_value = ctx.sound.name)) {
    				set_data(t, t_value);
    			}

    			if ((changed.notificationSounds) && option_value_value !== (option_value_value = ctx.sound.file)) {
    				option.__value = option_value_value;
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(option);
    			}
    		}
    	};
    }

    // (317:16) {#if showSettingsSaved}
    function create_if_block_1$1(ctx) {
    	var div, p, img, t0, t1_value = M.settings_saved, t1, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			img = element("img");
    			t0 = space();
    			t1 = text(t1_value);
    			this.h();
    		},

    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true }, false);
    			var div_nodes = children(div);

    			p = claim_element(div_nodes, "P", {}, false);
    			var p_nodes = children(p);

    			img = claim_element(p_nodes, "IMG", { src: true, alt: true }, false);
    			var img_nodes = children(img);

    			img_nodes.forEach(detach);
    			t0 = claim_text(p_nodes, " ");
    			t1 = claim_text(p_nodes, t1_value);
    			p_nodes.forEach(detach);
    			div_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			attr(img, "src", "/images/check.svg");
    			attr(img, "alt", "check mark");
    			add_location(img, file$3, 318, 27, 14370);
    			add_location(p, file$3, 318, 24, 14367);
    			attr(div, "class", "save");
    			add_location(div, file$3, 317, 20, 14292);
    			dispose = listen(div, "click", ctx.dismissSettingsSaved);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, p);
    			append(p, img);
    			append(p, t0);
    			append(p, t1);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    // (126:0) <Page>
    function create_default_slot(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.settings) && create_if_block$1(ctx);

    	return {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			if (if_block) if_block.l(nodes);
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.settings) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var current;

    	var page = new Page({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			page.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			page.$$.fragment.l(nodes);
    		},

    		m: function mount(target, anchor) {
    			mount_component(page, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var page_changes = {};
    			if (changed.$$scope || changed.settings || changed.showSettingsSaved || changed.notificationSounds || changed.focusTimerBPM || changed.focusTimerSound || changed.timerSounds) page_changes.$$scope = { changed, ctx };
    			page.$set(page_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(page, detaching);
    		}
    	};
    }

    function setSound(filename) {
        if(filename !== "null"){
            play(filename);
        }
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

        function getFocusTimerBpm() {
            let sound = settings.focus.timerSound;
            return sound
                && sound.metronome
                && sound.metronome.bpm;
        }

        let settingsClient = new SettingsClient();
        let soundsClient = new SoundsClient();
        let settings = null;
        let showSettingsSaved = false;
        let showSettingsSavedTimeout = null;
        let notificationSounds = null;
        let timerSounds = null;
        let timerSound = null;
        let timerSoundMutex = new Mutex();
        let focusTimerSound = null;
        let focusTimerBPM = null;

        settingsClient.getSettings()
            .then((response)=>{
                $$invalidate('settings', settings = response);
                $$invalidate('focusTimerSound', focusTimerSound = getFocusTimerSound());
                $$invalidate('focusTimerBPM', focusTimerBPM = getFocusTimerBpm());
            });

        soundsClient.getNotificationSounds()
            .then((response)=>{
                $$invalidate('notificationSounds', notificationSounds = response);
            });
        
        soundsClient.getTimerSounds()
            .then((response)=>{
                $$invalidate('timerSounds', timerSounds = response);
            });

        function getFocusTimerSound() {
            let sound = settings && settings.focus.timerSound;
            return sound && (sound.procedural || sound.metronome.files);
        }

        function saveSettings() {
            if(typeof settings !== 'object' || settings === null) return;
            settingsClient.setSettings(settings);
            clearTimeout(showSettingsSavedTimeout);
            showSettingsSavedTimeout = setTimeout(() => {
                $$invalidate('showSettingsSaved', showSettingsSaved = false);
            }, 1000);
            $$invalidate('showSettingsSaved', showSettingsSaved = true);
        }
        async function playTimerSound() {
            timerSoundMutex.exclusive(async () => {
                timerSound = await createTimerSound(settings.focus.timerSound);
                if(timerSound) timerSound.start();
            });
        }
        function stopTimerSound() {
            timerSoundMutex.exclusive(async () => {
                if(timerSound){
                    timerSound.close();  
                    timerSound = null;
                }
            });
        }
        function dismissSettingsSaved() {
            $$invalidate('showSettingsSaved', showSettingsSaved = false);
            clearTimeout(showSettingsSavedTimeout);
        }

        function setFocusTimerSound(value) {
            if(!settings) return
            let focus = settings.focus;
            if (!value) {
              focus.timerSound = null;
            } else if (!Array.isArray(value)) {
                focus.timerSound = {
                    procedural: value
                };
            } else if (focus.timerSound && focus.timerSound.metronome) {
                focus.timerSound.metronome.files = value;
            } else {
                focus.timerSound = {
                    metronome: {
                        files: value,
                        bpm: 60
                    }
                };
            }
        }

        function canPlayTimerSound() {
            let bpm = focusTimerBpm;
            return focusTimerSound
                && ((bpm == null) || (bpm > 0 && bpm <= 1000));
        }

    	function input0_value_binding(value) {
    		settings.focus.duration = value;
    		$$invalidate('settings', settings);
    	}

    	function select0_change_handler() {
    		focusTimerSound = select_value(this);
    		$$invalidate('focusTimerSound', focusTimerSound);
    		$$invalidate('timerSounds', timerSounds);
    	}

    	function input_value_binding(value) {
    		focusTimerBPM = value;
    		$$invalidate('focusTimerBPM', focusTimerBPM);
    	}

    	function input1_checked_binding(value_1) {
    		settings.focus.notifications.desktop = value_1;
    		$$invalidate('settings', settings);
    	}

    	function input2_checked_binding(value_2) {
    		settings.focus.notifications.tab = value_2;
    		$$invalidate('settings', settings);
    	}

    	function select1_change_handler() {
    		settings.focus.notifications.sound = select_value(this);
    		$$invalidate('settings', settings);
    		$$invalidate('notificationSounds', notificationSounds);
    	}

    	function input_handler(event) {
    		return setSound(event.target.value);
    	}

    	function input3_value_binding(value_3) {
    		settings.shortBreak.duration = value_3;
    		$$invalidate('settings', settings);
    	}

    	function input4_checked_binding(value_4) {
    		settings.shortBreak.notifications.desktop = value_4;
    		$$invalidate('settings', settings);
    	}

    	function input5_checked_binding(value_5) {
    		settings.shortBreak.notifications.tab = value_5;
    		$$invalidate('settings', settings);
    	}

    	function select2_change_handler() {
    		settings.shortBreak.notifications.sound = select_value(this);
    		$$invalidate('settings', settings);
    		$$invalidate('notificationSounds', notificationSounds);
    	}

    	function input_handler_1(event) {
    		return setSound(event.target.value);
    	}

    	function select3_change_handler() {
    		settings.longBreak.interval = select_value(this);
    		$$invalidate('settings', settings);
    		$$invalidate('notificationSounds', notificationSounds);
    	}

    	function input0_value_binding_1(value) {
    		settings.longBreak.duration = value;
    		$$invalidate('settings', settings);
    	}

    	function input1_checked_binding_1(value_1) {
    		settings.longBreak.notifications.desktop = value_1;
    		$$invalidate('settings', settings);
    	}

    	function input2_checked_binding_1(value_2) {
    		settings.longBreak.notifications.tab = value_2;
    		$$invalidate('settings', settings);
    	}

    	function select_change_handler() {
    		settings.longBreak.notifications.sound = select_value(this);
    		$$invalidate('settings', settings);
    		$$invalidate('notificationSounds', notificationSounds);
    	}

    	function input_handler_2(event) {
    		return setSound(event.target.value);
    	}

    	$$self.$$.update = ($$dirty = { settings: 1, focusTimerSound: 1 }) => {
    		if ($$dirty.settings) { saveSettings(); }
    		if ($$dirty.focusTimerSound) { setFocusTimerSound(focusTimerSound); }
    	};

    	return {
    		settings,
    		showSettingsSaved,
    		notificationSounds,
    		timerSounds,
    		focusTimerSound,
    		focusTimerBPM,
    		playTimerSound,
    		stopTimerSound,
    		dismissSettingsSaved,
    		canPlayTimerSound,
    		input0_value_binding,
    		select0_change_handler,
    		input_value_binding,
    		input1_checked_binding,
    		input2_checked_binding,
    		select1_change_handler,
    		input_handler,
    		input3_value_binding,
    		input4_checked_binding,
    		input5_checked_binding,
    		select2_change_handler,
    		input_handler_1,
    		select3_change_handler,
    		input0_value_binding_1,
    		input1_checked_binding_1,
    		input2_checked_binding_1,
    		select_change_handler,
    		input_handler_2
    	};
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
    	}
    }

    /* src/options/routes/History.svelte generated by Svelte v3.7.1 */

    const file$4 = "src/options/routes/History.svelte";

    // (10:0) <Page>
    function create_default_slot$1(ctx) {
    	var div, t;

    	return {
    		c: function create() {
    			div = element("div");
    			t = text("History");
    			this.h();
    		},

    		l: function claim(nodes) {
    			div = claim_element(nodes, "DIV", { class: true }, false);
    			var div_nodes = children(div);

    			t = claim_text(div_nodes, "History");
    			div_nodes.forEach(detach);
    			this.h();
    		},

    		h: function hydrate() {
    			attr(div, "class", "main svelte-1q4yxn8");
    			add_location(div, file$4, 10, 4, 339);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	var current;

    	var page = new Page({
    		props: {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			page.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			page.$$.fragment.l(nodes);
    		},

    		m: function mount(target, anchor) {
    			mount_component(page, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var page_changes = {};
    			if (changed.$$scope) page_changes.$$scope = { changed, ctx };
    			page.$set(page_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(page, detaching);
    		}
    	};
    }

    class History extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, []);
    	}
    }

    function loadRoutes (app) {
        app.routes = {
            'index': { 
                path: '/', 
                component: Settings
            },
            'profile': {
                path: '/profile', 
                component: History
            },
        };
    }

    var global$1 = (typeof global !== "undefined" ? global :
                typeof self !== "undefined" ? self :
                typeof window !== "undefined" ? window : {});

    // shim for using process in browser
    // based off https://github.com/defunctzombie/node-process/blob/master/browser.js

    function defaultSetTimout() {
        throw new Error('setTimeout has not been defined');
    }
    function defaultClearTimeout () {
        throw new Error('clearTimeout has not been defined');
    }
    var cachedSetTimeout = defaultSetTimout;
    var cachedClearTimeout = defaultClearTimeout;
    if (typeof global$1.setTimeout === 'function') {
        cachedSetTimeout = setTimeout;
    }
    if (typeof global$1.clearTimeout === 'function') {
        cachedClearTimeout = clearTimeout;
    }

    function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
            //normal enviroments in sane situations
            return setTimeout(fun, 0);
        }
        // if setTimeout wasn't available but was latter defined
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedSetTimeout(fun, 0);
        } catch(e){
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                return cachedSetTimeout.call(null, fun, 0);
            } catch(e){
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                return cachedSetTimeout.call(this, fun, 0);
            }
        }


    }
    function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
            //normal enviroments in sane situations
            return clearTimeout(marker);
        }
        // if clearTimeout wasn't available but was latter defined
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedClearTimeout(marker);
        } catch (e){
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                return cachedClearTimeout.call(null, marker);
            } catch (e){
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                return cachedClearTimeout.call(this, marker);
            }
        }



    }
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;

    function cleanUpNextTick() {
        if (!draining || !currentQueue) {
            return;
        }
        draining = false;
        if (currentQueue.length) {
            queue = currentQueue.concat(queue);
        } else {
            queueIndex = -1;
        }
        if (queue.length) {
            drainQueue();
        }
    }

    function drainQueue() {
        if (draining) {
            return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;

        var len = queue.length;
        while(len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
                if (currentQueue) {
                    currentQueue[queueIndex].run();
                }
            }
            queueIndex = -1;
            len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
    }
    function nextTick(fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i];
            }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
        }
    }
    // v8 likes predictible objects
    function Item(fun, array) {
        this.fun = fun;
        this.array = array;
    }
    Item.prototype.run = function () {
        this.fun.apply(null, this.array);
    };
    var title = 'browser';
    var platform = 'browser';
    var browser = true;
    var env = {};
    var argv = [];
    var version = ''; // empty string to avoid regexp issues
    var versions = {};
    var release = {};
    var config = {};

    function noop$1() {}

    var on = noop$1;
    var addListener = noop$1;
    var once = noop$1;
    var off = noop$1;
    var removeListener = noop$1;
    var removeAllListeners = noop$1;
    var emit = noop$1;

    function binding(name) {
        throw new Error('process.binding is not supported');
    }

    function cwd () { return '/' }
    function chdir (dir) {
        throw new Error('process.chdir is not supported');
    }function umask() { return 0; }

    // from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
    var performance = global$1.performance || {};
    var performanceNow =
      performance.now        ||
      performance.mozNow     ||
      performance.msNow      ||
      performance.oNow       ||
      performance.webkitNow  ||
      function(){ return (new Date()).getTime() };

    // generate timestamp or delta
    // see http://nodejs.org/api/process.html#process_process_hrtime
    function hrtime(previousTimestamp){
      var clocktime = performanceNow.call(performance)*1e-3;
      var seconds = Math.floor(clocktime);
      var nanoseconds = Math.floor((clocktime%1)*1e9);
      if (previousTimestamp) {
        seconds = seconds - previousTimestamp[0];
        nanoseconds = nanoseconds - previousTimestamp[1];
        if (nanoseconds<0) {
          seconds--;
          nanoseconds += 1e9;
        }
      }
      return [seconds,nanoseconds]
    }

    var startTime = new Date();
    function uptime() {
      var currentTime = new Date();
      var dif = currentTime - startTime;
      return dif / 1000;
    }

    var process = {
      nextTick: nextTick,
      title: title,
      browser: browser,
      env: env,
      argv: argv,
      version: version,
      versions: versions,
      on: on,
      addListener: addListener,
      once: once,
      off: off,
      removeListener: removeListener,
      removeAllListeners: removeAllListeners,
      emit: emit,
      binding: binding,
      cwd: cwd,
      chdir: chdir,
      umask: umask,
      hrtime: hrtime,
      platform: platform,
      release: release,
      config: config,
      uptime: uptime
    };

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var page = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
    	 module.exports = factory() ;
    }(commonjsGlobal, (function () {
    var isarray = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) == '[object Array]';
    };

    /**
     * Expose `pathToRegexp`.
     */
    var pathToRegexp_1 = pathToRegexp;
    var parse_1 = parse;
    var compile_1 = compile;
    var tokensToFunction_1 = tokensToFunction;
    var tokensToRegExp_1 = tokensToRegExp;

    /**
     * The main path matching regexp utility.
     *
     * @type {RegExp}
     */
    var PATH_REGEXP = new RegExp([
      // Match escaped characters that would otherwise appear in future matches.
      // This allows the user to escape special characters that won't transform.
      '(\\\\.)',
      // Match Express-style parameters and un-named parameters with a prefix
      // and optional suffixes. Matches appear as:
      //
      // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
      // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
      // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
      '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
    ].join('|'), 'g');

    /**
     * Parse a string for the raw tokens.
     *
     * @param  {String} str
     * @return {Array}
     */
    function parse (str) {
      var tokens = [];
      var key = 0;
      var index = 0;
      var path = '';
      var res;

      while ((res = PATH_REGEXP.exec(str)) != null) {
        var m = res[0];
        var escaped = res[1];
        var offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
          path += escaped[1];
          continue
        }

        // Push the current path onto the tokens.
        if (path) {
          tokens.push(path);
          path = '';
        }

        var prefix = res[2];
        var name = res[3];
        var capture = res[4];
        var group = res[5];
        var suffix = res[6];
        var asterisk = res[7];

        var repeat = suffix === '+' || suffix === '*';
        var optional = suffix === '?' || suffix === '*';
        var delimiter = prefix || '/';
        var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?');

        tokens.push({
          name: name || key++,
          prefix: prefix || '',
          delimiter: delimiter,
          optional: optional,
          repeat: repeat,
          pattern: escapeGroup(pattern)
        });
      }

      // Match any characters still remaining.
      if (index < str.length) {
        path += str.substr(index);
      }

      // If the path exists, push it onto the end.
      if (path) {
        tokens.push(path);
      }

      return tokens
    }

    /**
     * Compile a string to a template function for the path.
     *
     * @param  {String}   str
     * @return {Function}
     */
    function compile (str) {
      return tokensToFunction(parse(str))
    }

    /**
     * Expose a method for transforming tokens into the path function.
     */
    function tokensToFunction (tokens) {
      // Compile all the tokens into regexps.
      var matches = new Array(tokens.length);

      // Compile all the patterns before compilation.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
          matches[i] = new RegExp('^' + tokens[i].pattern + '$');
        }
      }

      return function (obj) {
        var path = '';
        var data = obj || {};

        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];

          if (typeof token === 'string') {
            path += token;

            continue
          }

          var value = data[token.name];
          var segment;

          if (value == null) {
            if (token.optional) {
              continue
            } else {
              throw new TypeError('Expected "' + token.name + '" to be defined')
            }
          }

          if (isarray(value)) {
            if (!token.repeat) {
              throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
            }

            if (value.length === 0) {
              if (token.optional) {
                continue
              } else {
                throw new TypeError('Expected "' + token.name + '" to not be empty')
              }
            }

            for (var j = 0; j < value.length; j++) {
              segment = encodeURIComponent(value[j]);

              if (!matches[i].test(segment)) {
                throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
              }

              path += (j === 0 ? token.prefix : token.delimiter) + segment;
            }

            continue
          }

          segment = encodeURIComponent(value);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += token.prefix + segment;
        }

        return path
      }
    }

    /**
     * Escape a regular expression string.
     *
     * @param  {String} str
     * @return {String}
     */
    function escapeString (str) {
      return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
    }

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {String} group
     * @return {String}
     */
    function escapeGroup (group) {
      return group.replace(/([=!:$\/()])/g, '\\$1')
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {RegExp} re
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function attachKeys (re, keys) {
      re.keys = keys;
      return re
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {String}
     */
    function flags (options) {
      return options.sensitive ? '' : 'i'
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {RegExp} path
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function regexpToRegexp (path, keys) {
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            prefix: null,
            delimiter: null,
            optional: false,
            repeat: false,
            pattern: null
          });
        }
      }

      return attachKeys(path, keys)
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {Array}  path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function arrayToRegexp (path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

      return attachKeys(regexp, keys)
    }

    /**
     * Create a path regexp from string input.
     *
     * @param  {String} path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function stringToRegexp (path, keys, options) {
      var tokens = parse(path);
      var re = tokensToRegExp(tokens, options);

      // Attach keys back to the regexp.
      for (var i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] !== 'string') {
          keys.push(tokens[i]);
        }
      }

      return attachKeys(re, keys)
    }

    /**
     * Expose a function for taking tokens and returning a RegExp.
     *
     * @param  {Array}  tokens
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function tokensToRegExp (tokens, options) {
      options = options || {};

      var strict = options.strict;
      var end = options.end !== false;
      var route = '';
      var lastToken = tokens[tokens.length - 1];
      var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken);

      // Iterate over the tokens and create our regexp string.
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (typeof token === 'string') {
          route += escapeString(token);
        } else {
          var prefix = escapeString(token.prefix);
          var capture = token.pattern;

          if (token.repeat) {
            capture += '(?:' + prefix + capture + ')*';
          }

          if (token.optional) {
            if (prefix) {
              capture = '(?:' + prefix + '(' + capture + '))?';
            } else {
              capture = '(' + capture + ')?';
            }
          } else {
            capture = prefix + '(' + capture + ')';
          }

          route += capture;
        }
      }

      // In non-strict mode we allow a slash at the end of match. If the path to
      // match already ends with a slash, we remove it for consistency. The slash
      // is valid at the end of a path match, not in the middle. This is important
      // in non-ending mode, where "/test/" shouldn't match "/test//route".
      if (!strict) {
        route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
      }

      if (end) {
        route += '$';
      } else {
        // In non-ending mode, we need the capturing groups to match as much as
        // possible by using a positive lookahead to the end or next path segment.
        route += strict && endsWithSlash ? '' : '(?=\\/|$)';
      }

      return new RegExp('^' + route, flags(options))
    }

    /**
     * Normalize the given path string, returning a regular expression.
     *
     * An empty array can be passed in for the keys, which will hold the
     * placeholder key descriptions. For example, using `/user/:id`, `keys` will
     * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
     *
     * @param  {(String|RegExp|Array)} path
     * @param  {Array}                 [keys]
     * @param  {Object}                [options]
     * @return {RegExp}
     */
    function pathToRegexp (path, keys, options) {
      keys = keys || [];

      if (!isarray(keys)) {
        options = keys;
        keys = [];
      } else if (!options) {
        options = {};
      }

      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
      }

      if (isarray(path)) {
        return arrayToRegexp(path, keys, options)
      }

      return stringToRegexp(path, keys, options)
    }

    pathToRegexp_1.parse = parse_1;
    pathToRegexp_1.compile = compile_1;
    pathToRegexp_1.tokensToFunction = tokensToFunction_1;
    pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

    /**
       * Module dependencies.
       */

      

      /**
       * Short-cuts for global-object checks
       */

      var hasDocument = ('undefined' !== typeof document);
      var hasWindow = ('undefined' !== typeof window);
      var hasHistory = ('undefined' !== typeof history);
      var hasProcess = typeof process !== 'undefined';

      /**
       * Detect click event
       */
      var clickEvent = hasDocument && document.ontouchstart ? 'touchstart' : 'click';

      /**
       * To work properly with the URL
       * history.location generated polyfill in https://github.com/devote/HTML5-History-API
       */

      var isLocation = hasWindow && !!(window.history.location || window.location);

      /**
       * The page instance
       * @api private
       */
      function Page() {
        // public things
        this.callbacks = [];
        this.exits = [];
        this.current = '';
        this.len = 0;

        // private things
        this._decodeURLComponents = true;
        this._base = '';
        this._strict = false;
        this._running = false;
        this._hashbang = false;

        // bound functions
        this.clickHandler = this.clickHandler.bind(this);
        this._onpopstate = this._onpopstate.bind(this);
      }

      /**
       * Configure the instance of page. This can be called multiple times.
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.configure = function(options) {
        var opts = options || {};

        this._window = opts.window || (hasWindow && window);
        this._decodeURLComponents = opts.decodeURLComponents !== false;
        this._popstate = opts.popstate !== false && hasWindow;
        this._click = opts.click !== false && hasDocument;
        this._hashbang = !!opts.hashbang;

        var _window = this._window;
        if(this._popstate) {
          _window.addEventListener('popstate', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('popstate', this._onpopstate, false);
        }

        if (this._click) {
          _window.document.addEventListener(clickEvent, this.clickHandler, false);
        } else if(hasDocument) {
          _window.document.removeEventListener(clickEvent, this.clickHandler, false);
        }

        if(this._hashbang && hasWindow && !hasHistory) {
          _window.addEventListener('hashchange', this._onpopstate, false);
        } else if(hasWindow) {
          _window.removeEventListener('hashchange', this._onpopstate, false);
        }
      };

      /**
       * Get or set basepath to `path`.
       *
       * @param {string} path
       * @api public
       */

      Page.prototype.base = function(path) {
        if (0 === arguments.length) return this._base;
        this._base = path;
      };

      /**
       * Gets the `base`, which depends on whether we are using History or
       * hashbang routing.

       * @api private
       */
      Page.prototype._getBase = function() {
        var base = this._base;
        if(!!base) return base;
        var loc = hasWindow && this._window && this._window.location;

        if(hasWindow && this._hashbang && loc && loc.protocol === 'file:') {
          base = loc.pathname;
        }

        return base;
      };

      /**
       * Get or set strict path matching to `enable`
       *
       * @param {boolean} enable
       * @api public
       */

      Page.prototype.strict = function(enable) {
        if (0 === arguments.length) return this._strict;
        this._strict = enable;
      };


      /**
       * Bind with the given `options`.
       *
       * Options:
       *
       *    - `click` bind to click events [true]
       *    - `popstate` bind to popstate [true]
       *    - `dispatch` perform initial dispatch [true]
       *
       * @param {Object} options
       * @api public
       */

      Page.prototype.start = function(options) {
        var opts = options || {};
        this.configure(opts);

        if (false === opts.dispatch) return;
        this._running = true;

        var url;
        if(isLocation) {
          var window = this._window;
          var loc = window.location;

          if(this._hashbang && ~loc.hash.indexOf('#!')) {
            url = loc.hash.substr(2) + loc.search;
          } else if (this._hashbang) {
            url = loc.search + loc.hash;
          } else {
            url = loc.pathname + loc.search + loc.hash;
          }
        }

        this.replace(url, null, true, opts.dispatch);
      };

      /**
       * Unbind click and popstate event handlers.
       *
       * @api public
       */

      Page.prototype.stop = function() {
        if (!this._running) return;
        this.current = '';
        this.len = 0;
        this._running = false;

        var window = this._window;
        this._click && window.document.removeEventListener(clickEvent, this.clickHandler, false);
        hasWindow && window.removeEventListener('popstate', this._onpopstate, false);
        hasWindow && window.removeEventListener('hashchange', this._onpopstate, false);
      };

      /**
       * Show `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} dispatch
       * @param {boolean=} push
       * @return {!Context}
       * @api public
       */

      Page.prototype.show = function(path, state, dispatch, push) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        if (false !== dispatch) this.dispatch(ctx, prev);
        if (false !== ctx.handled && false !== push) ctx.pushState();
        return ctx;
      };

      /**
       * Goes back in the history
       * Back should always let the current route push state and then go back.
       *
       * @param {string} path - fallback path to go back if no more history exists, if undefined defaults to page.base
       * @param {Object=} state
       * @api public
       */

      Page.prototype.back = function(path, state) {
        var page = this;
        if (this.len > 0) {
          var window = this._window;
          // this may need more testing to see if all browsers
          // wait for the next tick to go back in history
          hasHistory && window.history.back();
          this.len--;
        } else if (path) {
          setTimeout(function() {
            page.show(path, state);
          });
        } else {
          setTimeout(function() {
            page.show(page._getBase(), state);
          });
        }
      };

      /**
       * Register route to redirect from one path to other
       * or just redirect to another route
       *
       * @param {string} from - if param 'to' is undefined redirects to 'from'
       * @param {string=} to
       * @api public
       */
      Page.prototype.redirect = function(from, to) {
        var inst = this;

        // Define route from a path to another
        if ('string' === typeof from && 'string' === typeof to) {
          page.call(this, from, function(e) {
            setTimeout(function() {
              inst.replace(/** @type {!string} */ (to));
            }, 0);
          });
        }

        // Wait for the push state and replace it with another
        if ('string' === typeof from && 'undefined' === typeof to) {
          setTimeout(function() {
            inst.replace(from);
          }, 0);
        }
      };

      /**
       * Replace `path` with optional `state` object.
       *
       * @param {string} path
       * @param {Object=} state
       * @param {boolean=} init
       * @param {boolean=} dispatch
       * @return {!Context}
       * @api public
       */


      Page.prototype.replace = function(path, state, init, dispatch) {
        var ctx = new Context(path, state, this),
          prev = this.prevContext;
        this.prevContext = ctx;
        this.current = ctx.path;
        ctx.init = init;
        ctx.save(); // save before dispatching, which may redirect
        if (false !== dispatch) this.dispatch(ctx, prev);
        return ctx;
      };

      /**
       * Dispatch the given `ctx`.
       *
       * @param {Context} ctx
       * @api private
       */

      Page.prototype.dispatch = function(ctx, prev) {
        var i = 0, j = 0, page = this;

        function nextExit() {
          var fn = page.exits[j++];
          if (!fn) return nextEnter();
          fn(prev, nextExit);
        }

        function nextEnter() {
          var fn = page.callbacks[i++];

          if (ctx.path !== page.current) {
            ctx.handled = false;
            return;
          }
          if (!fn) return unhandled.call(page, ctx);
          fn(ctx, nextEnter);
        }

        if (prev) {
          nextExit();
        } else {
          nextEnter();
        }
      };

      /**
       * Register an exit route on `path` with
       * callback `fn()`, which will be called
       * on the previous context when a new
       * page is visited.
       */
      Page.prototype.exit = function(path, fn) {
        if (typeof path === 'function') {
          return this.exit('*', path);
        }

        var route = new Route(path, null, this);
        for (var i = 1; i < arguments.length; ++i) {
          this.exits.push(route.middleware(arguments[i]));
        }
      };

      /**
       * Handle "click" events.
       */

      /* jshint +W054 */
      Page.prototype.clickHandler = function(e) {
        if (1 !== this._which(e)) return;

        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        if (e.defaultPrevented) return;

        // ensure link
        // use shadow dom when available if not, fall back to composedPath()
        // for browsers that only have shady
        var el = e.target;
        var eventPath = e.path || (e.composedPath ? e.composedPath() : null);

        if(eventPath) {
          for (var i = 0; i < eventPath.length; i++) {
            if (!eventPath[i].nodeName) continue;
            if (eventPath[i].nodeName.toUpperCase() !== 'A') continue;
            if (!eventPath[i].href) continue;

            el = eventPath[i];
            break;
          }
        }

        // continue ensure link
        // el.nodeName for svg links are 'a' instead of 'A'
        while (el && 'A' !== el.nodeName.toUpperCase()) el = el.parentNode;
        if (!el || 'A' !== el.nodeName.toUpperCase()) return;

        // check if link is inside an svg
        // in this case, both href and target are always inside an object
        var svg = (typeof el.href === 'object') && el.href.constructor.name === 'SVGAnimatedString';

        // Ignore if tag has
        // 1. "download" attribute
        // 2. rel="external" attribute
        if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

        // ensure non-hash for the same path
        var link = el.getAttribute('href');
        if(!this._hashbang && this._samePath(el) && (el.hash || '#' === link)) return;

        // Check for mailto: in the href
        if (link && link.indexOf('mailto:') > -1) return;

        // check target
        // svg target is an object and its desired value is in .baseVal property
        if (svg ? el.target.baseVal : el.target) return;

        // x-origin
        // note: svg links that are not relative don't call click events (and skip page.js)
        // consequently, all svg links tested inside page.js are relative and in the same origin
        if (!svg && !this.sameOrigin(el.href)) return;

        // rebuild path
        // There aren't .pathname and .search properties in svg links, so we use href
        // Also, svg href is an object and its desired value is in .baseVal property
        var path = svg ? el.href.baseVal : (el.pathname + el.search + (el.hash || ''));

        path = path[0] !== '/' ? '/' + path : path;

        // strip leading "/[drive letter]:" on NW.js on Windows
        if (hasProcess && path.match(/^\/[a-zA-Z]:\//)) {
          path = path.replace(/^\/[a-zA-Z]:\//, '/');
        }

        // same page
        var orig = path;
        var pageBase = this._getBase();

        if (path.indexOf(pageBase) === 0) {
          path = path.substr(pageBase.length);
        }

        if (this._hashbang) path = path.replace('#!', '');

        if (pageBase && orig === path && (!isLocation || this._window.location.protocol !== 'file:')) {
          return;
        }

        e.preventDefault();
        this.show(orig);
      };

      /**
       * Handle "populate" events.
       * @api private
       */

      Page.prototype._onpopstate = (function () {
        var loaded = false;
        if ( ! hasWindow ) {
          return function () {};
        }
        if (hasDocument && document.readyState === 'complete') {
          loaded = true;
        } else {
          window.addEventListener('load', function() {
            setTimeout(function() {
              loaded = true;
            }, 0);
          });
        }
        return function onpopstate(e) {
          if (!loaded) return;
          var page = this;
          if (e.state) {
            var path = e.state.path;
            page.replace(path, e.state);
          } else if (isLocation) {
            var loc = page._window.location;
            page.show(loc.pathname + loc.search + loc.hash, undefined, undefined, false);
          }
        };
      })();

      /**
       * Event button.
       */
      Page.prototype._which = function(e) {
        e = e || (hasWindow && this._window.event);
        return null == e.which ? e.button : e.which;
      };

      /**
       * Convert to a URL object
       * @api private
       */
      Page.prototype._toURL = function(href) {
        var window = this._window;
        if(typeof URL === 'function' && isLocation) {
          return new URL(href, window.location.toString());
        } else if (hasDocument) {
          var anc = window.document.createElement('a');
          anc.href = href;
          return anc;
        }
      };

      /**
       * Check if `href` is the same origin.
       * @param {string} href
       * @api public
       */

      Page.prototype.sameOrigin = function(href) {
        if(!href || !isLocation) return false;

        var url = this._toURL(href);
        var window = this._window;

        var loc = window.location;
        return loc.protocol === url.protocol &&
          loc.hostname === url.hostname &&
          loc.port === url.port;
      };

      /**
       * @api private
       */
      Page.prototype._samePath = function(url) {
        if(!isLocation) return false;
        var window = this._window;
        var loc = window.location;
        return url.pathname === loc.pathname &&
          url.search === loc.search;
      };

      /**
       * Remove URL encoding from the given `str`.
       * Accommodates whitespace in both x-www-form-urlencoded
       * and regular percent-encoded form.
       *
       * @param {string} val - URL component to decode
       * @api private
       */
      Page.prototype._decodeURLEncodedURIComponent = function(val) {
        if (typeof val !== 'string') { return val; }
        return this._decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
      };

      /**
       * Create a new `page` instance and function
       */
      function createPage() {
        var pageInstance = new Page();

        function pageFn(/* args */) {
          return page.apply(pageInstance, arguments);
        }

        // Copy all of the things over. In 2.0 maybe we use setPrototypeOf
        pageFn.callbacks = pageInstance.callbacks;
        pageFn.exits = pageInstance.exits;
        pageFn.base = pageInstance.base.bind(pageInstance);
        pageFn.strict = pageInstance.strict.bind(pageInstance);
        pageFn.start = pageInstance.start.bind(pageInstance);
        pageFn.stop = pageInstance.stop.bind(pageInstance);
        pageFn.show = pageInstance.show.bind(pageInstance);
        pageFn.back = pageInstance.back.bind(pageInstance);
        pageFn.redirect = pageInstance.redirect.bind(pageInstance);
        pageFn.replace = pageInstance.replace.bind(pageInstance);
        pageFn.dispatch = pageInstance.dispatch.bind(pageInstance);
        pageFn.exit = pageInstance.exit.bind(pageInstance);
        pageFn.configure = pageInstance.configure.bind(pageInstance);
        pageFn.sameOrigin = pageInstance.sameOrigin.bind(pageInstance);
        pageFn.clickHandler = pageInstance.clickHandler.bind(pageInstance);

        pageFn.create = createPage;

        Object.defineProperty(pageFn, 'len', {
          get: function(){
            return pageInstance.len;
          },
          set: function(val) {
            pageInstance.len = val;
          }
        });

        Object.defineProperty(pageFn, 'current', {
          get: function(){
            return pageInstance.current;
          },
          set: function(val) {
            pageInstance.current = val;
          }
        });

        // In 2.0 these can be named exports
        pageFn.Context = Context;
        pageFn.Route = Route;

        return pageFn;
      }

      /**
       * Register `path` with callback `fn()`,
       * or route `path`, or redirection,
       * or `page.start()`.
       *
       *   page(fn);
       *   page('*', fn);
       *   page('/user/:id', load, user);
       *   page('/user/' + user.id, { some: 'thing' });
       *   page('/user/' + user.id);
       *   page('/from', '/to')
       *   page();
       *
       * @param {string|!Function|!Object} path
       * @param {Function=} fn
       * @api public
       */

      function page(path, fn) {
        // <callback>
        if ('function' === typeof path) {
          return page.call(this, '*', path);
        }

        // route <path> to <callback ...>
        if ('function' === typeof fn) {
          var route = new Route(/** @type {string} */ (path), null, this);
          for (var i = 1; i < arguments.length; ++i) {
            this.callbacks.push(route.middleware(arguments[i]));
          }
          // show <path> with [state]
        } else if ('string' === typeof path) {
          this['string' === typeof fn ? 'redirect' : 'show'](path, fn);
          // start [options]
        } else {
          this.start(path);
        }
      }

      /**
       * Unhandled `ctx`. When it's not the initial
       * popstate then redirect. If you wish to handle
       * 404s on your own use `page('*', callback)`.
       *
       * @param {Context} ctx
       * @api private
       */
      function unhandled(ctx) {
        if (ctx.handled) return;
        var current;
        var page = this;
        var window = page._window;

        if (page._hashbang) {
          current = isLocation && this._getBase() + window.location.hash.replace('#!', '');
        } else {
          current = isLocation && window.location.pathname + window.location.search;
        }

        if (current === ctx.canonicalPath) return;
        page.stop();
        ctx.handled = false;
        isLocation && (window.location.href = ctx.canonicalPath);
      }

      /**
       * Escapes RegExp characters in the given string.
       *
       * @param {string} s
       * @api private
       */
      function escapeRegExp(s) {
        return s.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1');
      }

      /**
       * Initialize a new "request" `Context`
       * with the given `path` and optional initial `state`.
       *
       * @constructor
       * @param {string} path
       * @param {Object=} state
       * @api public
       */

      function Context(path, state, pageInstance) {
        var _page = this.page = pageInstance || page;
        var window = _page._window;
        var hashbang = _page._hashbang;

        var pageBase = _page._getBase();
        if ('/' === path[0] && 0 !== path.indexOf(pageBase)) path = pageBase + (hashbang ? '#!' : '') + path;
        var i = path.indexOf('?');

        this.canonicalPath = path;
        var re = new RegExp('^' + escapeRegExp(pageBase));
        this.path = path.replace(re, '') || '/';
        if (hashbang) this.path = this.path.replace('#!', '') || '/';

        this.title = (hasDocument && window.document.title);
        this.state = state || {};
        this.state.path = path;
        this.querystring = ~i ? _page._decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
        this.pathname = _page._decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
        this.params = {};

        // fragment
        this.hash = '';
        if (!hashbang) {
          if (!~this.path.indexOf('#')) return;
          var parts = this.path.split('#');
          this.path = this.pathname = parts[0];
          this.hash = _page._decodeURLEncodedURIComponent(parts[1]) || '';
          this.querystring = this.querystring.split('#')[0];
        }
      }

      /**
       * Push state.
       *
       * @api private
       */

      Context.prototype.pushState = function() {
        var page = this.page;
        var window = page._window;
        var hashbang = page._hashbang;

        page.len++;
        if (hasHistory) {
            window.history.pushState(this.state, this.title,
              hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Save the context state.
       *
       * @api public
       */

      Context.prototype.save = function() {
        var page = this.page;
        if (hasHistory) {
            page._window.history.replaceState(this.state, this.title,
              page._hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
        }
      };

      /**
       * Initialize `Route` with the given HTTP `path`,
       * and an array of `callbacks` and `options`.
       *
       * Options:
       *
       *   - `sensitive`    enable case-sensitive routes
       *   - `strict`       enable strict matching for trailing slashes
       *
       * @constructor
       * @param {string} path
       * @param {Object=} options
       * @api private
       */

      function Route(path, options, page) {
        var _page = this.page = page || globalPage;
        var opts = options || {};
        opts.strict = opts.strict || page._strict;
        this.path = (path === '*') ? '(.*)' : path;
        this.method = 'GET';
        this.regexp = pathToRegexp_1(this.path, this.keys = [], opts);
      }

      /**
       * Return route middleware with
       * the given callback `fn()`.
       *
       * @param {Function} fn
       * @return {Function}
       * @api public
       */

      Route.prototype.middleware = function(fn) {
        var self = this;
        return function(ctx, next) {
          if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
          next();
        };
      };

      /**
       * Check if this route matches `path`, if so
       * populate `params`.
       *
       * @param {string} path
       * @param {Object} params
       * @return {boolean}
       * @api private
       */

      Route.prototype.match = function(path, params) {
        var keys = this.keys,
          qsIndex = path.indexOf('?'),
          pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
          m = this.regexp.exec(decodeURIComponent(pathname));

        if (!m) return false;

        for (var i = 1, len = m.length; i < len; ++i) {
          var key = keys[i - 1];
          var val = this.page._decodeURLEncodedURIComponent(m[i]);
          if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
            params[key.name] = val;
          }
        }

        return true;
      };


      /**
       * Module exports.
       */

      var globalPage = createPage();
      var page_js = globalPage;
      var default_1 = globalPage;

    page_js.default = default_1;

    return page_js;

    })));
    });

    function router(data) {
        const { app, target, basePath, routes } = data;
        
        page.base(basePath);

        for (const route in routes) {
            page(route, (ctx, next) => {
                app.previous = app.current;
                if (app.current) app.current.$destroy();
                
                app.current = new routes[route]({
                    target: target,
                    props: ctx.params,
                    hydrate: true,
                });
            });
        }

        //Go home on404
        page('*', function(ctx){
            console.error(`Error 404: ${ctx.path} Not Found`);
            page('/');
        });

        page({});
    }

    /**
     * The `mapRoutes` utility converts a map of named application routes into a
     * format that can be understood by Mithril.
     *
     * @see https://lhorie.github.io/mithril/mithril.route.html#defining-routes
     * @param {Object} routes
     * @param {String} [basePath]
     * @return {Object}
     */
    function mapRoutes(routes, basePath = '') {
      const map = {};
      
      for (const key in routes) {
        const route = routes[key];

        if (route.component) {
          map[basePath + route.path] = route.component;
        }
      }
      
      return map;
    }

    class Application {
        constructor(){
            /**
             * A map of routes, keyed by a unique route name. Each route is an object
             * containing the following properties:
             *
             * - `path` The path that the route is accessed at.
             * - `component` The Mithril component to render when this route is active.
             *
             * @example
             * app.routes.home = {path: '/d/:id', component: IndexPage};
             *
             * @type {Object}
             * @public
             */
            this.routes = {};

            loadRoutes(this);

            //Register routes
            router({
                app: this,
                target: document.getElementById('application'),
                basePath: window.location.pathname,
                routes: mapRoutes(this.routes, ''),
            });
        }
    }

    window.app = new Application();

}());
//# sourceMappingURL=options.js.map
