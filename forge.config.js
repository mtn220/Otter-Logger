const path = require('path');

module.exports = {
    packagerConfig: {
        asar: true,
        icon: path.join(process.cwd(), 'img', 'icon.ico'),
    },
    rebuildConfig: {},
    makers: [
        // {
        //     name: '@electron-forge/maker-squirrel',
        //     config: {
        //         iconUrl: path.join(process.cwd(), 'img', 'icon.ico'),
        //         setupIcon: path.join(process.cwd(), 'img', 'icon.ico'),
        //     },
        // },
        {
            name: '@electron-forge/maker-zip',
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {},
        },
    ],
};
