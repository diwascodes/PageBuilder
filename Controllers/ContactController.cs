using Microsoft.AspNetCore.Mvc;
using WebsiteBuilder.Models;

namespace WebsiteBuilder.Controllers
{
    [Route("api/contact")]
    [ApiController]
    public class ContactController : ControllerBase
    {
        [HttpPost("submit")]
        public IActionResult Submit([FromBody] ContactFormModel model)
        {
            if (model == null)
            {
                return BadRequest(new { success = false, message = "Invalid data received." });
            }

            if (string.IsNullOrWhiteSpace(model.FirstName) || 
                string.IsNullOrWhiteSpace(model.Email) || 
                string.IsNullOrWhiteSpace(model.Message))
            {
                return BadRequest(new { success = false, message = "Required fields are missing." });
            }

            // In a real environment, you would use an IEmailService here.
            // For this project, we simulate the email sending.
            
            // Example of how it would look with an email service:
            // _emailService.SendEmailAsync("admin@yourdomain.com", "Contact Form: " + model.FirstName, model.Message);

            return Ok(new { success = true, message = "Thank you! Your message has been sent successfully." });
        }
    }
}
