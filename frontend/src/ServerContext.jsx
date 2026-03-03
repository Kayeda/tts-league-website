import { createContext, useContext, useState } from 'react';

const SERVERS = {
    main: {
        label: 'Main Server (Server 1)',
        liveTiming: 'http://trytosurvive.servegame.com:8772/live-timing?server=0',
        joinServer: 'https://acstuff.ru/s/q:race/online/join?httpPort=8081&ip=trytosurvive.servegame.com',
    },
    alt: {
        label: 'Alt Server (Server 2)',
        liveTiming: 'http://trytosurvive.servegame.com:8772/live-timing?server=1',
        joinServer: 'https://acstuff.ru/s/q:race/online/join?httpPort=8083&ip=trytosurvive.servegame.com',
    },
};

const ServerContext = createContext();

export function ServerProvider({ children }) {
    const [serverKey, setServerKey] = useState('main');

    const value = {
        serverKey,
        setServerKey,
        server: SERVERS[serverKey],
        servers: SERVERS,
    };

    return (
        <ServerContext.Provider value={value}>
            {children}
        </ServerContext.Provider>
    );
}

export function useServer() {
    return useContext(ServerContext);
}
