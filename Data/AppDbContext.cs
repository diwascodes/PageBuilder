using Microsoft.EntityFrameworkCore;
using WebsiteBuilder.Models;

namespace WebsiteBuilder.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Page> Pages { get; set; }
        public DbSet<PageBlock> PageBlocks { get; set; }
        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Page>()
                .HasIndex(p => p.Slug)
                .IsUnique();

            modelBuilder.Entity<PageBlock>()
                .HasOne(pb => pb.Page)
                .WithMany(p => p.Blocks)
                .HasForeignKey(pb => pb.PageId)
                .OnDelete(DeleteBehavior.Cascade);

            base.OnModelCreating(modelBuilder);
        }
    }
}
