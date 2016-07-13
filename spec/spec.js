describe('Routes', () => {
    require('./routes/auth_route_spec');
    require('./routes/login_route_spec');
    require('./routes/playlists_route_spec');
    require('./routes/submit_route_spec');
});

describe('Services', () => {
    require('./services/host_service_spec');
    require('./services/spotify_api_service_spec');
});
