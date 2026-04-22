using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace WebsiteBuilder.Controllers
{
    [Route("api/upload")]
    [ApiController]
    [Authorize]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadController(IWebHostEnvironment env)
        {
            _env = env;
        }

        [HttpPost]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "No file provided." });

            // Validate file type
            var allowed = new[] { ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".ico", ".bmp" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowed.Contains(ext))
                return BadRequest(new { error = "Invalid file type. Allowed: " + string.Join(", ", allowed) });

            // Limit file size to 5MB
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { error = "File too large. Max 5MB." });

            // Ensure uploads directory exists
            var uploadsDir = Path.Combine(_env.WebRootPath, "uploads");
            Directory.CreateDirectory(uploadsDir);

            // Generate unique filename
            var uniqueName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsDir, uniqueName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"/uploads/{uniqueName}";
            return Ok(new { url });
        }
    }
}
