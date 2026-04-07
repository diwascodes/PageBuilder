using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebsiteBuilder.Data;

namespace WebsiteBuilder.Controllers
{
    public class PageController : Controller
    {
        private readonly AppDbContext _context;

        public PageController(AppDbContext context)
        {
            _context = context;
        }

        [Route("page/{slug}")]
        public async Task<IActionResult> Preview(string slug)
        {
            var page = await _context.Pages
                .Include(p => p.Blocks)
                .FirstOrDefaultAsync(p => p.Slug == slug);

            if (page == null) return NotFound();

            page.Blocks = page.Blocks.OrderBy(b => b.ComponentOrder).ToList();

            return View(page);
        }
    }
}
