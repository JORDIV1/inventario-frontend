const DEFAULT_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiClient {
  #isRefreshing = false; //evita llamadas refresh duplicadas
  #refreshPromise = null;
  #baseUrl;
  constructor({ baseUrl = DEFAULT_BASE_URL } = {}) {
    if (!baseUrl) {
      throw new Error("API_BASE_URL_REQUIRED");
    }

    //quita los / al final
    this.#baseUrl = baseUrl.replace(/\/+$/, "");
  }

  /**
   * Normaliza el path y construye la URL final.
   * Devuelve también el path normalizado para comparaciones internas.
   */
  #buildUrl(path) {
    if (typeof path !== "string" || path.length === 0) {
      throw new Error("API_PATH_REQUIRED");
    }
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${this.#baseUrl}${normalizedPath}`;
    return { url, normalizedPath };
  }

  async #doFetch(url, config) {
    try {
      const response = await fetch(url, config);
      return response;
    } catch (error) {
      throw new Error("NETWORK_ERROR");
    }
  }
  /**
   * Intenta parsear JSON solo si el Content-Type lo indica.
   */
  async #parseJson(response) {
    const contentType = response.headers.get("Content-Type") || "";
    let data = null;
    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }
    }
    return data;
  }

  /**
   * Hace POST a /auth/refresh para renovar el access token.
   * No usa #request para evitar recursión.
   */

  async #refreshAccessToken() {
    if (this.#isRefreshing && this.#refreshPromise) {
      return this.#refreshPromise;
    }
    this.#isRefreshing = true;

    const { url } = this.#buildUrl("/auth/refresh");
    const config = {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    };

    this.#refreshPromise = this.#doFetch(url, config)
      .then(async (res) => {
        const data = await this.#parseJson(res);

        return { ok: res.ok, status: res.status, data };
      })
      .catch(() => ({ ok: false, status: 0, data: null }))
      .finally(() => {
        this.#isRefreshing = false;
        this.#refreshPromise = null;
      });

    return this.#refreshPromise;
  }
  /**
   * Método central, hace la request, intenta refresh en 401
   * vuelve a intentar una vez y devuelve
   * { ok, status, data }.
   */
  async #request(method, path, { body, headers, params } = {}) {
    const { url, normalizedPath } = this.#buildUrl(path);

    //query limpias
    let finalUrl = url;

    if (params && Object.keys(params).length > 0) {
      const qs = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === "") continue;
        qs.append(key, String(value));
      }
      const qsString = qs.toString();
      if (qsString) {
        finalUrl += `?${qsString}`;
      }
    }
    const config = {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
    };
    if (body !== undefined && body !== null) {
      config.body = JSON.stringify(body);
    }

    //request originial

    let response = await this.#doFetch(finalUrl, config);

    const isAuthPath =
      normalizedPath.startsWith("/auth/refresh") ||
      normalizedPath.startsWith("/auth/login") ||
      normalizedPath.startsWith("/auth/register");
    if (response.status === 401 && !isAuthPath) {
      const refreshResult = await this.#refreshAccessToken();
      if (refreshResult.ok) {
        //reintenta una sola vez
        response = await this.#doFetch(finalUrl, config);
      }
    }
    // Devolvemos el 401 y  lo maneje el AuthService/AuthGuard

    const data = await this.#parseJson(response);
    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  get(path, options) {
    return this.#request("GET", path, options);
  }
  post(path, body, options = {}) {
    return this.#request("POST", path, { ...options, body });
  }
  put(path, body, options = {}) {
    return this.#request("PUT", path, { ...options, body });
  }
  patch(path, body, options = {}) {
    return this.#request("PATCH", path, { ...options, body });
  }
  delete(path, options) {
    return this.#request("DELETE", path, options);
  }
}

export const apiClient = new ApiClient();
