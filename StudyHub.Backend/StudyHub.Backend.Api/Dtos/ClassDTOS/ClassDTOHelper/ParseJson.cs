using System.Text.Json;
using static StudyHub.Backend.Api.Dtos.ClassDTOS.CreateNotificationDto;

namespace StudyHub.Backend.Api.Dtos.ClassDTOS.ClassDTOHelper
{
    public static class ParseJson
    {
        public static List<LinkItem> ParseLinksJson(string? linksJson)
        {
            if (string.IsNullOrWhiteSpace(linksJson))
                return new List<LinkItem>();

            var s = linksJson.Trim();
            var opts = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            try
            {
                var direct = JsonSerializer.Deserialize<List<LinkItem>>(s, opts);
                if (direct != null && direct.Count > 0) return NormalizeList(direct);
            }
            catch { /* ignore */ }

            try
            {
                var unescaped = JsonSerializer.Deserialize<string>(s);
                if (!string.IsNullOrWhiteSpace(unescaped))
                {
                    try
                    {
                        var list = JsonSerializer.Deserialize<List<LinkItem>>(unescaped, opts);
                        if (list != null && list.Count > 0) return NormalizeList(list);
                    }
                    catch { /* ignore */ }

                    try
                    {
                        using var doc = JsonDocument.Parse(unescaped);
                        if (doc.RootElement.ValueKind == JsonValueKind.Array)
                        {
                            var parsed = ParseJsonElementArray(doc.RootElement);
                            if (parsed.Count > 0) return NormalizeList(parsed);
                        }
                    }
                    catch { /* ignore */ }
                }
            }
            catch { /* ignore */ }

            try
            {
                var cleaned = s.Replace("\\\"", "\"");
                var list = JsonSerializer.Deserialize<List<LinkItem>>(cleaned, opts);
                if (list != null && list.Count > 0) return NormalizeList(list);
            }
            catch { /* ignore */ }

            try
            {
                using var doc = JsonDocument.Parse(s);
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    var parsed = ParseJsonElementArray(doc.RootElement);
                    if (parsed.Count > 0) return NormalizeList(parsed);
                }
            }
            catch { /* ignore */ }

            return new List<LinkItem>();
        }

        public static List<LinkItem> ParseJsonElementArray(JsonElement arr)
        {
            var result = new List<LinkItem>();
            foreach (var el in arr.EnumerateArray())
            {
                try
                {
                    if (el.ValueKind == JsonValueKind.Object)
                    {
                        string? url = null;
                        string? title = null;

                        if (el.TryGetProperty("url", out var pUrl) && pUrl.ValueKind == JsonValueKind.String)
                            url = pUrl.GetString();
                        else if (el.TryGetProperty("link", out var pLink) && pLink.ValueKind == JsonValueKind.String)
                            url = pLink.GetString();

                        if (el.TryGetProperty("title", out var pTitle) && pTitle.ValueKind == JsonValueKind.String)
                            title = pTitle.GetString();

                        if (!string.IsNullOrWhiteSpace(url))
                        {
                            result.Add(new LinkItem
                            {
                                Url = NormalizeUrl(url!),
                                Title = string.IsNullOrWhiteSpace(title) ? NormalizeUrl(url!) : title
                            });
                        }
                    }
                    else if (el.ValueKind == JsonValueKind.String)
                    {
                        var url = el.GetString();
                        if (!string.IsNullOrWhiteSpace(url))
                        {
                            result.Add(new LinkItem
                            {
                                Url = NormalizeUrl(url!),
                                Title = NormalizeUrl(url!)
                            });
                        }
                    }
                }
                catch
                {
                    // ignore element
                }
            }
            return result;
        }

        public static List<LinkItem> NormalizeList(IEnumerable<LinkItem> items)
        {
            var list = new List<LinkItem>();
            foreach (var it in items)
            {
                if (it == null) continue;
                var url = (it.Url ?? string.Empty).Trim();
                if (string.IsNullOrWhiteSpace(url)) continue;

                // try unescape if still quoted
                if ((url.StartsWith("\"") && url.EndsWith("\"")) || url.Contains("\\\""))
                {
                    try
                    {
                        var maybe = JsonSerializer.Deserialize<string>(url);
                        if (!string.IsNullOrWhiteSpace(maybe)) url = maybe.Trim();
                    }
                    catch { /* ignore */ }
                }

                url = NormalizeUrl(url);
                var title = (it.Title ?? string.Empty).Trim();
                if (string.IsNullOrWhiteSpace(title)) title = url;

                list.Add(new LinkItem
                {
                    Url = url,
                    Title = title
                });
            }
            return list;
        }

        public static string NormalizeUrl(string url)
        {
            if (string.IsNullOrWhiteSpace(url)) return url!;
            url = url.Trim();

            if (Uri.IsWellFormedUriString(url, UriKind.Absolute)) return url;
            if (url.StartsWith("//")) return "https:" + url;
            if (url.StartsWith("www.", StringComparison.OrdinalIgnoreCase)) return "https://" + url;
            if (url.Contains('.') && !url.Contains(' ')) return "https://" + url;

            return url;
        }
    }

}
