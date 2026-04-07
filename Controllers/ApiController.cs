using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebsiteBuilder.Data;
using WebsiteBuilder.Models;

namespace WebsiteBuilder.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PagesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PagesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetPages()
        {
            var pagesRaw = await _context.Pages
                .Include(p => p.Blocks)
                .ToListAsync();

            var result = pagesRaw.Select(p => new
            {
                id = p.Id,
                name = p.Name,
                slug = p.Slug,
                blocks = p.Blocks.OrderBy(b => b.ComponentOrder).Select(b => new
                {
                    id = b.Id,
                    pageId = b.PageId,
                    componentOrder = b.ComponentOrder,
                    type = b.BlockType,
                    data = System.Text.Json.JsonDocument.Parse(b.DataJson).RootElement
                })
            });

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<Page>> CreatePage([FromBody] PageCreateDto dto)
        {
            var page = new Page
            {
                Name = dto.Name,
                Slug = GenerateSlug(dto.Name),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Pages.Add(page);
            await _context.SaveChangesAsync();

            return Ok(new { id = page.Id, name = page.Name, slug = page.Slug, blocks = new List<object>() });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePage(int id, [FromBody] Page dto)
        {
            var page = await _context.Pages.FindAsync(id);
            if (page == null) return NotFound();

            page.Name = dto.Name;
            if (!string.IsNullOrEmpty(dto.Slug))
            {
                page.Slug = dto.Slug;
            }
            page.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(page);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePage(int id)
        {
            var page = await _context.Pages.FindAsync(id);
            if (page == null) return NotFound();

            _context.Pages.Remove(page);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("{id}/blocks")]
        public async Task<IActionResult> SaveBlocks(int id, [FromBody] List<PageBlockDto> blocks)
        {
            var page = await _context.Pages.Include(p => p.Blocks).FirstOrDefaultAsync(p => p.Id == id);
            if (page == null) return NotFound();

            // Clear existing blocks
            _context.PageBlocks.RemoveRange(page.Blocks);
            await _context.SaveChangesAsync();

            int order = 1;
            foreach (var dto in blocks)
            {
                var block = new PageBlock
                {
                    PageId = id,
                    BlockType = dto.Type,
                    ComponentOrder = order++,
                    DataJson = dto.Data.ToString()
                };

                _context.PageBlocks.Add(block);
            }

            page.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { success = true });
        }

        private string GenerateSlug(string name)
        {
            return name.ToLower().Replace(" ", "-");
        }
    }

    public class PageCreateDto
    {
        public string Name { get; set; }
    }

    public class PageBlockDto
    {
        public string Type { get; set; }
        public System.Text.Json.JsonElement Data { get; set; }
    }
}
