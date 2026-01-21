
(function() {
    const domain = window.location.origin || '';

    const WIDGETS_BASE_URL = domain.includes(":5173") || domain.includes(":63342")
        ? 'http://localhost:5173' : 'https://widgets.tradingeconomics.com';


    const widgetConfigs = {
        'ec': {
            script: 'economics-chart-widget.js',
            id: 'economics-chart-widget'
        },
        'mc': {
            script: 'market-charts-widget.js',
            id: 'charts-widget'
        },
        'cl': {
            script: 'calendar-widget.js',
            id: 'calendar-widget'
        },
        'mo': {
            script: 'market-overview-widget.js',
            id: 'market-overview-widget'
        },
        'ns': {
            script: 'streams-widget.js',
            id: 'streams-widget'
        },
        'tm': {
            script: 'treemap-widget.js',
            id: 'treemap-widget'
        },
        'mt': {
            script: 'matrix-widget.js',
            id: 'matrix-widget'
        }
    };

    function buildWidgets() {
        const widgetDivs = document.querySelectorAll('.te-embed');

        widgetDivs.forEach(div => {
            const widget = div.dataset.widget || 'ec';

            const widgetType = widget.split('-pro')[0];

            if (!widgetType || !widgetConfigs[widgetType]) {
                console.error(`Unknown widget type: ${widgetType}`);
                return;
            }

            const config = {};

            function toCamelCase(s) {
                return s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
            }

            Array.from(div.attributes).forEach(attr => {
                if (attr.name.startsWith('data-')) {
                    const key = attr.name.substring(5);
                    if (key !== 'widget') {
                        const camelCaseKey = toCamelCase(key);
                        let value = attr.value;
                        try {
                            if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                                value = JSON.parse(value);
                            } else if (value === 'true') {
                                value = true;
                            } else if (value === 'false') {
                                value = false;
                            } else if (!isNaN(value) && value.trim() !== '') {
                                value = Number(value);
                            }
                        } catch (e) {
                            // Keep as string if parsing fails
                        }
                        config[camelCaseKey] = value;
                    }
                }
            });
            
            const { script, id } = widgetConfigs[widgetType];
            const scriptSrc = `${WIDGETS_BASE_URL}/static/${script}`;
            if (typeof config.isFreeMode === "undefined") config.isFreeMode = widget.includes('-pro');
            const isFreeMode = ["localhost", "127.0.0.1", "cosmiccatnebula.wixsite.com", "editor.wix.com"].includes(window.location.hostname.toLowerCase()) || config.isFreeMode === true;
            const iframeConfig = {...config, useContainerSize: true, isFreeMode: isFreeMode};
            const configStr = JSON.stringify(iframeConfig);

            const iframe = document.createElement('iframe');

            const useContainer = !!config.useContainerSize;

            function formatSize(val, fallback = '100%') {
                if (useContainer) return '100%';
                if (val == null || val === '') return fallback;
                if (typeof val === 'number') return `${val}px`;
                const s = String(val).trim();
                if (/^\d+$/.test(s)) return `${s}px`;
                return s;
            }

            iframe.style.width = formatSize(config.width);
            iframe.style.height = formatSize(config.height);

            iframe.style.border = 'none';
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('allowtransparency', 'true');
            iframe.setAttribute('title', `Trading Economics ${widgetType} widget`);
            iframe.baseURI = window.location.href;
            iframe.srcdoc = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <style>
                            body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
                        </style>
                    </head>
                    <body>
                        <div id="${id}" data-host="${window.location.hostname}" style="width: 100%; height: 100%;">
                            <script src="${scriptSrc}">${configStr}</script>
                        </div>
                    </body>
                </html>
            `;

            div.parentNode.replaceChild(iframe, div);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", buildWidgets);
    } else {
        buildWidgets();
    }
})();
