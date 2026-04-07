using System;
using System.Collections.Generic;

namespace WebsiteBuilder.Models
{
    public class Page
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Slug { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public List<PageBlock> Blocks { get; set; } = new List<PageBlock>();
    }
}
