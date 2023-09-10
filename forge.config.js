const path = require('path');

module.exports = {
    packagerConfig: {
        asar: true,
        name: 'Otter Logger',
        icon: path.join(process.cwd(), 'assets', 'icon'),
        extraResource: [path.join(process.cwd(), 'assets', 'icon.icns')],
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                iconUrl: path.join(process.cwd(), 'assets', 'icon.ico'),
                setupIcon: path.join(process.cwd(), 'assets', 'icon.ico'),
            },
        },
        {
            name: '@electron-forge/maker-zip',
        },
        {
            name: '@electron-forge/maker-dmg',
            config: {
                name: 'Otter Logger',
                icon: path.join(process.cwd(), 'assets', 'icon.icns'),
                format: 'ULFO',
            },
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {},
        },
    ],
};
