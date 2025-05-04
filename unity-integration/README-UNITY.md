# Six Path Studio Token API Integration for Unity

This guide shows Unity developers how to fetch and spend player tokens using the Supabase Edge Functions you’ve deployed. No Supabase Auth required—just a shared secret.

## Prerequisites

- Unity 2020.3 or newer
- .NET 4.x scripting runtime
- Internet access for REST API calls

## Endpoints

Replace `<project>` with your Supabase project ref (e.g. `stgerbqwwmvouqprlwzn`):

| Action              | URL                                                                  |
|---------------------|----------------------------------------------------------------------|
| Retrieve balance    | `https://<project>.supabase.co/functions/v1/retrieve-user-tokens`    |
| Spend tokens        | `https://<project>.supabase.co/functions/v1/spend-user-tokens`       |

## Security

- **GAME_API_SECRET**: shared secret stored as an environment variable
- Include it in each request header:
  ```http
  Authorization: Bearer <GAME_API_SECRET>
  ```
- **Do not** hardcode the secret in your repository. Use Unity secure storage or environment variables.

## Unity HTTP Client Example

Copy this script into your Unity project and assign `gameSecret`, `projectUrl` in the Inspector.

```csharp
using UnityEngine;
using UnityEngine.Networking;
using System;
using System.Collections;
using System.Text;

public class TokenService : MonoBehaviour
{
    [Header("API Settings")]
    public string projectUrl = "https://<project>.supabase.co";
    public string gameSecret;

    IEnumerator RetrieveBalance(string username, Action<int> callback)
    {
        string url = projectUrl + "/functions/v1/retrieve-user-tokens";
        string body = JsonUtility.ToJson(new { username });

        using var req = new UnityWebRequest(url, "POST");
        req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("Authorization", "Bearer " + gameSecret);

        yield return req.SendWebRequest();
        
        if (req.result == UnityWebRequest.Result.Success)
        {
            var resp = JsonUtility.FromJson<BalanceResponse>(req.downloadHandler.text);
            callback(resp.balance);
        }
        else
        {
            Debug.LogError($"RetrieveBalance failed: {req.error}");
            callback(0);
        }
    }

    IEnumerator SpendTokens(string username, int amount, Action<bool,int> callback)
    {
        string url = projectUrl + "/functions/v1/spend-user-tokens";
        string body = JsonUtility.ToJson(new { username, amount });

        using var req = new UnityWebRequest(url, "POST");
        req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("Authorization", "Bearer " + gameSecret);

        yield return req.SendWebRequest();
        
        if (req.result == UnityWebRequest.Result.Success)
        {
            var resp = JsonUtility.FromJson<SpendResponse>(req.downloadHandler.text);
            callback(true, resp.remaining);
        }
        else
        {
            Debug.LogError($"SpendTokens failed: {req.error}");
            callback(false, 0);
        }
    }

    // Response models
    [Serializable] class BalanceResponse { public int balance; }
    [Serializable] class SpendResponse { public int remaining; }
}
```

## Usage

1. Attach `TokenService` to a GameObject in your scene.
2. Set `projectUrl` to your Supabase URL and `gameSecret` to the shared secret.
3. Call `StartCoroutine(RetrieveBalance(username, OnBalance));` on login.
4. Call `StartCoroutine(SpendTokens(username, cost, OnSpend));` when spending.

```csharp
void OnBalance(int balance) { /* update UI */ }
void OnSpend(bool success, int remaining) { /* handle result */ }
```

## Troubleshooting

- **401 Unauthorized**: Verify `gameSecret` matches the Supabase env var.
- **Invalid payload**: Ensure JSON body uses `username` (string) and `amount` (int).
- **Network errors**: Check your device’s internet connection and CORS settings in Supabase.

---
Six Path Studio • Backend v1 • May 2025