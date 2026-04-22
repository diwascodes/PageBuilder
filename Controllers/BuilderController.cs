using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace WebsiteBuilder.Controllers
{
    [Authorize]
    public class BuilderController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
