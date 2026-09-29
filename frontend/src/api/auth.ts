const BASE_URL = 'http://localhost:3000'

export const register = async (email: string, password: string): Promise<{ accessToken: string, refreshToken: string }> => {
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({email, password})
    })
    return registerResponse.json()
}

export const login = async (email: string, password: string): Promise<{ accessToken: string, refreshToken: string }> => {
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({email, password})
    })
    return loginResponse.json()
}

export const refresh = async (refreshToken: string): Promise<{ accessToken: string}> => {
    const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
    })
    return refreshResponse.json()
}