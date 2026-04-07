using Microsoft.AspNetCore.Mvc;

namespace WebsiteBuilder.Controllers
{
    public class BuilderController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
